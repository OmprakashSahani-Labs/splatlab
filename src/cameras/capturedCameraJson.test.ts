import { describe, expect, it } from 'vitest'
import { parseCapturedCameraJson } from './capturedCameraJson'

function createValidCameraValue() {
  return {
    id: 'frame-0001',
    name: ' Frame 1 ',
    sourceFrame: ' 0001.png ',
    pose: {
      position: [0, 1, 2],
      quaternion: [0, 0, 0, 1],
    },
    intrinsics: {
      width: 1920,
      height: 1080,
      fx: 1200,
      fy: 1200,
      cx: 951.25,
      cy: 537.75,
      near: 0.01,
      far: 1000,
    },
  }
}

function expectInvalid(value: unknown, field: string) {
  expect(() => parseCapturedCameraJson(JSON.stringify(value))).toThrowError(
    new Error(`Invalid camera.${field}.`),
  )
}

describe('parseCapturedCameraJson', () => {
  it('preserves a complete camera including off-center intrinsics and source strings', () => {
    const source = createValidCameraValue()
    const camera = parseCapturedCameraJson(JSON.stringify(source))

    expect(camera).toStrictEqual(source)
    expect(camera.pose.position).toEqual([0, 1, 2])
    expect(camera.pose.quaternion).toEqual([0, 0, 0, 1])
    expect(camera.name).toBe(' Frame 1 ')
    expect(camera.sourceFrame).toBe(' 0001.png ')
  })

  it('accepts a minimal camera without adding optional properties', () => {
    const { id, pose, intrinsics } = createValidCameraValue()
    const source = { id, pose, intrinsics }
    const camera = parseCapturedCameraJson(JSON.stringify(source))

    expect(camera).toStrictEqual(source)
    expect(camera).not.toHaveProperty('name')
    expect(camera).not.toHaveProperty('sourceFrame')
  })

  it('reconstructs only supported fields and leaves the source unchanged', () => {
    const expected = createValidCameraValue()
    const source = {
      ...expected,
      extra: 'root-only',
      pose: { ...expected.pose, extra: 'pose-only' },
      intrinsics: { ...expected.intrinsics, extra: 'intrinsics-only' },
    }
    const json = JSON.stringify(source)
    const camera = parseCapturedCameraJson(json)

    expect(camera).toStrictEqual(expected)
    expect(camera).not.toHaveProperty('extra')
    expect(camera.pose).not.toHaveProperty('extra')
    expect(camera.intrinsics).not.toHaveProperty('extra')
    expect(camera).not.toBe(source)
    expect(camera.pose).not.toBe(source.pose)
    expect(camera.intrinsics).not.toBe(source.intrinsics)
    expect(camera.pose.position).not.toBe(source.pose.position)
    expect(camera.pose.quaternion).not.toBe(source.pose.quaternion)
    expect(JSON.stringify(source)).toBe(json)
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', ' \t\n '],
    ['non-string', 42],
    ['missing', undefined],
  ])('rejects a %s id', (_, id) => {
    expectInvalid({ ...createValidCameraValue(), id }, 'id')
  })

  it('preserves whitespace around a non-empty id', () => {
    const source = { ...createValidCameraValue(), id: ' frame-0001 ' }
    expect(parseCapturedCameraJson(JSON.stringify(source)).id).toBe(source.id)
  })

  it.each([
    ['malformed syntax', '{"id":'],
    ['array root', '[]'],
    ['null root', 'null'],
    ['primitive root', '42'],
  ])('rejects %s with a deterministic JSON error', (_, json) => {
    expect(() => parseCapturedCameraJson(json)).toThrowError(
      new Error('Invalid camera JSON.'),
    )
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['array', []],
    ['primitive', 42],
  ])('rejects a %s pose', (_, pose) => {
    expectInvalid({ ...createValidCameraValue(), pose }, 'pose')
  })

  it.each([
    { field: 'position', value: [0, 1] },
    { field: 'position', value: [0, 1, 2, 3] },
    { field: 'position', value: [0, '1', 2] },
    { field: 'quaternion', value: [0, 0, 1] },
    { field: 'quaternion', value: [0, 0, 0, 1, 2] },
    { field: 'quaternion', value: [0, 0, 0, '1'] },
  ])('rejects invalid pose.$field data: $value', ({ field, value }) => {
    const source = createValidCameraValue()
    expectInvalid({ ...source, pose: { ...source.pose, [field]: value } }, `pose.${field}`)
  })

  it.each(['name', 'sourceFrame'])('rejects a non-string %s', (field) => {
    expectInvalid({ ...createValidCameraValue(), [field]: 42 }, field)
  })

  it('preserves explicitly empty optional strings', () => {
    const source = { ...createValidCameraValue(), name: '', sourceFrame: '' }
    expect(parseCapturedCameraJson(JSON.stringify(source))).toStrictEqual(source)
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['array', []],
    ['primitive', 42],
  ])('rejects %s intrinsics', (_, intrinsics) => {
    expectInvalid({ ...createValidCameraValue(), intrinsics }, 'intrinsics')
  })

  it.each(['width', 'height', 'fx', 'fy', 'cx', 'cy', 'near', 'far'])(
    'rejects a non-number intrinsics.%s',
    (field) => {
      const source = createValidCameraValue()
      expectInvalid(
        { ...source, intrinsics: { ...source.intrinsics, [field]: 'invalid' } },
        `intrinsics.${field}`,
      )
    },
  )

  it('rejects an intrinsic number that overflows to infinity', () => {
    const source = createValidCameraValue()
    const json = JSON.stringify({
      ...source,
      intrinsics: { ...source.intrinsics, cx: 'overflow' },
    }).replace('"overflow"', '1e400')

    expect(() => parseCapturedCameraJson(json)).toThrowError(
      new Error('Invalid camera.intrinsics.cx.'),
    )
  })

  it.each([
    ['width', 0],
    ['width', -1],
    ['height', 0],
    ['fx', 0],
    ['fy', 0],
    ['near', 0],
    ['near', -1],
    ['far', 0.01],
    ['far', 0.005],
  ])('rejects intrinsics.%s = %s outside its valid range', (field, value) => {
    const source = createValidCameraValue()
    expectInvalid(
      { ...source, intrinsics: { ...source.intrinsics, [field]: value } },
      `intrinsics.${field}`,
    )
  })

  it('accepts positive fractional image dimensions', () => {
    const source = createValidCameraValue()
    source.intrinsics.width = 1920.5
    source.intrinsics.height = 1080.25

    expect(parseCapturedCameraJson(JSON.stringify(source))).toStrictEqual(source)
  })

  it('accepts principal points outside image bounds', () => {
    const source = createValidCameraValue()
    source.intrinsics.cx = -10.5
    source.intrinsics.cy = 2000.25

    expect(parseCapturedCameraJson(JSON.stringify(source))).toStrictEqual(source)
  })
})
