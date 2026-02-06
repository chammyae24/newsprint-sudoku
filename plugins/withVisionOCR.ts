import { ConfigPlugin, withDangerousMod, withInfoPlist } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Expo Config Plugin to enable Apple Vision OCR for handwriting recognition.
 * This plugin:
 * 1. Adds Vision framework to the iOS project
 * 2. Creates the native Swift module for text recognition
 * 3. Creates the Objective-C bridge file
 */
const withVisionOCR: ConfigPlugin = (config) => {
  // Add any required Info.plist entries
  config = withInfoPlist(config, (config) => {
    // Vision framework doesn't require special plist entries
    // But we can add a custom key to indicate the feature is enabled
    config.modResults.VisionOCREnabled = true;
    return config;
  });

  // Create native module files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      
      // Get the project name from the config
      const projectName = config.modRequest.projectName || 'NewsprintSudoku';
      const modulePath = path.join(iosPath, projectName);
      
      // Ensure directory exists
      if (!fs.existsSync(modulePath)) {
        fs.mkdirSync(modulePath, { recursive: true });
      }

      // Create Swift module
      const swiftContent = `import Foundation
import Vision
import UIKit

@objc(VisionOCRModule)
class VisionOCRModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func recognizeText(_ imagePath: String,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    // Load image from path
    guard let image = UIImage(contentsOfFile: imagePath),
          let cgImage = image.cgImage else {
      reject("IMAGE_ERROR", "Failed to load image from path: \\(imagePath)", nil)
      return
    }
    
    // Create Vision request
    let request = VNRecognizeTextRequest { request, error in
      if let error = error {
        reject("VISION_ERROR", "Vision request failed: \\(error.localizedDescription)", error)
        return
      }
      
      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        resolve([])
        return
      }
      
      // Process results and filter for digits 1-9
      var results: [[String: Any]] = []
      
      for observation in observations {
        guard let topCandidate = observation.topCandidates(1).first else { continue }
        
        let text = topCandidate.string
        let confidence = Double(topCandidate.confidence)
        let boundingBox = observation.boundingBox
        
        // Filter for single digits 1-9 only
        if text.count == 1, let digit = Int(text), digit >= 1, digit <= 9 {
          results.append([
            "text": text,
            "confidence": confidence,
            "boundingBox": [
              "x": boundingBox.origin.x,
              "y": boundingBox.origin.y,
              "width": boundingBox.width,
              "height": boundingBox.height
            ]
          ])
        }
      }
      
      resolve(results)
    }
    
    // Configure request for accurate digit recognition
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-US"]
    request.usesLanguageCorrection = false
    
    // Perform the request
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try handler.perform([request])
      } catch {
        reject("HANDLER_ERROR", "Failed to perform Vision request: \\(error.localizedDescription)", error)
      }
    }
  }
  
  @objc
  func checkStylusSupport(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Check if device supports Apple Pencil
    // This is a simple check - actual pencil detection happens at touch time
    DispatchQueue.main.async {
      let isPadDevice = UIDevice.current.userInterfaceIdiom == .pad
      resolve([
        "isPadDevice": isPadDevice,
        "maySupportPencil": isPadDevice // iPads may support Apple Pencil
      ])
    }
  }
}
`;
      
      fs.writeFileSync(path.join(modulePath, 'VisionOCRModule.swift'), swiftContent);

      // Create Objective-C bridge file
      const objcContent = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VisionOCRModule, NSObject)

RCT_EXTERN_METHOD(recognizeText:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(checkStylusSupport:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`;
      
      fs.writeFileSync(path.join(modulePath, 'VisionOCRModule.m'), objcContent);

      // Create or update bridging header if needed
      const bridgingHeaderPath = path.join(modulePath, `${projectName}-Bridging-Header.h`);
      if (!fs.existsSync(bridgingHeaderPath)) {
        const bridgingContent = `//
//  ${projectName}-Bridging-Header.h
//  ${projectName}
//
//  Auto-generated by withVisionOCR Expo plugin
//

#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
`;
        fs.writeFileSync(bridgingHeaderPath, bridgingContent);
      }

      return config;
    },
  ]);

  return config;
};

export default withVisionOCR;
