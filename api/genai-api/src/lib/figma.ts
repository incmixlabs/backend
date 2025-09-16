export class FeatureRemovedError extends Error {
  constructor(feature: string) {
    super(`${feature} is currently removed/not implemented`)
    this.name = "FeatureRemovedError"
  }
}

export class FigmaService {
  getFigmaImage(_url: string): Promise<string> {
    // TODO: Implement Figma image extraction
    // This would normally use the Figma API to get the image from a Figma URL
    throw new FeatureRemovedError("FigmaService.getFigmaImage")
  }

  generateReactFromFigma(
    _url: string,
    _userTier: string,
    _options: {
      framework?: string
      componentLibrary?: string
    }
  ): Promise<{ code: string; imageUrl: string }> {
    // TODO: Implement React code generation from Figma
    // This would normally use AI to generate React code from Figma designs
    throw new FeatureRemovedError("FigmaService.generateReactFromFigma")
  }
}
