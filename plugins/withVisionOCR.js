"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
/**
 * Expo Config Plugin to enable Apple Vision OCR for handwriting recognition.
 * This plugin:
 * 1. Adds Vision framework to the iOS project
 * 2. Creates the native Swift module for text recognition
 * 3. Creates the Objective-C bridge file
 */
var withVisionOCR = function (config) {
    // Add any required Info.plist entries
    config = (0, config_plugins_1.withInfoPlist)(config, function (config) {
        // Vision framework doesn't require special plist entries
        // But we can add a custom key to indicate the feature is enabled
        config.modResults.VisionOCREnabled = true;
        return config;
    });
    // Create native module files
    config = (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        function (config) { return __awaiter(void 0, void 0, void 0, function () {
            var projectRoot, iosPath, projectName, modulePath, swiftContent, objcContent, bridgingHeaderPath, bridgingContent;
            return __generator(this, function (_a) {
                projectRoot = config.modRequest.projectRoot;
                iosPath = path.join(projectRoot, 'ios');
                projectName = config.modRequest.projectName || 'NewsprintSudoku';
                modulePath = path.join(iosPath, projectName);
                // Ensure directory exists
                if (!fs.existsSync(modulePath)) {
                    fs.mkdirSync(modulePath, { recursive: true });
                }
                swiftContent = "import Foundation\nimport Vision\nimport UIKit\n\n@objc(VisionOCRModule)\nclass VisionOCRModule: NSObject {\n  \n  @objc\n  static func requiresMainQueueSetup() -> Bool {\n    return false\n  }\n  \n  @objc\n  func recognizeText(_ imagePath: String,\n                     resolver resolve: @escaping RCTPromiseResolveBlock,\n                     rejecter reject: @escaping RCTPromiseRejectBlock) {\n    \n    // Load image from path\n    guard let image = UIImage(contentsOfFile: imagePath),\n          let cgImage = image.cgImage else {\n      reject(\"IMAGE_ERROR\", \"Failed to load image from path: \\(imagePath)\", nil)\n      return\n    }\n    \n    // Create Vision request\n    let request = VNRecognizeTextRequest { request, error in\n      if let error = error {\n        reject(\"VISION_ERROR\", \"Vision request failed: \\(error.localizedDescription)\", error)\n        return\n      }\n      \n      guard let observations = request.results as? [VNRecognizedTextObservation] else {\n        resolve([])\n        return\n      }\n      \n      // Process results and filter for digits 1-9\n      var results: [[String: Any]] = []\n      \n      for observation in observations {\n        guard let topCandidate = observation.topCandidates(1).first else { continue }\n        \n        let text = topCandidate.string\n        let confidence = Double(topCandidate.confidence)\n        let boundingBox = observation.boundingBox\n        \n        // Filter for single digits 1-9 only\n        if text.count == 1, let digit = Int(text), digit >= 1, digit <= 9 {\n          results.append([\n            \"text\": text,\n            \"confidence\": confidence,\n            \"boundingBox\": [\n              \"x\": boundingBox.origin.x,\n              \"y\": boundingBox.origin.y,\n              \"width\": boundingBox.width,\n              \"height\": boundingBox.height\n            ]\n          ])\n        }\n      }\n      \n      resolve(results)\n    }\n    \n    // Configure request for accurate digit recognition\n    request.recognitionLevel = .accurate\n    request.recognitionLanguages = [\"en-US\"]\n    request.usesLanguageCorrection = false\n    \n    // Perform the request\n    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])\n    \n    DispatchQueue.global(qos: .userInitiated).async {\n      do {\n        try handler.perform([request])\n      } catch {\n        reject(\"HANDLER_ERROR\", \"Failed to perform Vision request: \\(error.localizedDescription)\", error)\n      }\n    }\n  }\n  \n  @objc\n  func checkStylusSupport(_ resolve: @escaping RCTPromiseResolveBlock,\n                          rejecter reject: @escaping RCTPromiseRejectBlock) {\n    // Check if device supports Apple Pencil\n    // This is a simple check - actual pencil detection happens at touch time\n    DispatchQueue.main.async {\n      let isPadDevice = UIDevice.current.userInterfaceIdiom == .pad\n      resolve([\n        \"isPadDevice\": isPadDevice,\n        \"maySupportPencil\": isPadDevice // iPads may support Apple Pencil\n      ])\n    }\n  }\n}\n";
                fs.writeFileSync(path.join(modulePath, 'VisionOCRModule.swift'), swiftContent);
                objcContent = "#import <React/RCTBridgeModule.h>\n\n@interface RCT_EXTERN_MODULE(VisionOCRModule, NSObject)\n\nRCT_EXTERN_METHOD(recognizeText:(NSString *)imagePath\n                  resolver:(RCTPromiseResolveBlock)resolve\n                  rejecter:(RCTPromiseRejectBlock)reject)\n\nRCT_EXTERN_METHOD(checkStylusSupport:(RCTPromiseResolveBlock)resolve\n                  rejecter:(RCTPromiseRejectBlock)reject)\n\n@end\n";
                fs.writeFileSync(path.join(modulePath, 'VisionOCRModule.m'), objcContent);
                bridgingHeaderPath = path.join(modulePath, "".concat(projectName, "-Bridging-Header.h"));
                if (!fs.existsSync(bridgingHeaderPath)) {
                    bridgingContent = "//\n//  ".concat(projectName, "-Bridging-Header.h\n//  ").concat(projectName, "\n//\n//  Auto-generated by withVisionOCR Expo plugin\n//\n\n#import <React/RCTBridgeModule.h>\n#import <React/RCTViewManager.h>\n");
                    fs.writeFileSync(bridgingHeaderPath, bridgingContent);
                }
                return [2 /*return*/, config];
            });
        }); },
    ]);
    return config;
};
exports.default = withVisionOCR;
