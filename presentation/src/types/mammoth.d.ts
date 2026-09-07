// mammoth ships no type definitions. We only use extractRawText from the
// prebuilt browser bundle, so declare just that surface.
declare module 'mammoth/mammoth.browser.js' {
  export interface MammothMessage {
    type: string
    message: string
  }
  export interface RawTextResult {
    value: string
    messages: MammothMessage[]
  }
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<RawTextResult>

  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<RawTextResult>
  }
  export default mammoth
}
