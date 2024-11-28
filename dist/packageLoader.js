"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path = __importStar(require("path"));
/**
 * Constants.
 */
const BASE_URL = new URL('https://esm.sh');
/**
 * PackageLoader class.
 */
class PackageLoader {
    //#endregion Private Properties
    //#region Constructor
    /**
     * Constructor.
     * @param _outputFolder The output folder.
     * @param _target The target (e.g., es2022, esnext).
     */
    constructor(_outputFolder, _target) {
        this._outputFolder = _outputFolder;
        this._target = _target;
        //#region Private Properties
        /**
         * Gets the dependencies that have been already been loaded.
         */
        this._alreadyLoadedDependencies = new Set;
        /**
         * Gets or sets a value indicating whether the resources have been loaded.
         */
        this._resourcesLoaded = false;
        console.log('PackageLoader');
    }
    //#endregion Constructor
    /**
     * Load the package descriptors.
     * @param packageDescriptors The package descriptors.
     */
    loadPackageDescriptors(packageDescriptors) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create the cleaned output folder.
            if (fs_1.default.existsSync(this._outputFolder)) {
                fs_1.default.rmSync(this._outputFolder, { recursive: true, force: true });
            }
            fs_1.default.mkdirSync(this._outputFolder);
            // Load the resources.
            for (const packageDescriptor of packageDescriptors) {
                yield this.loadPackageDescriptor(packageDescriptor);
            }
        });
    }
    //#region Private Methods
    /**
     * Loads a package descriptor.
     * @param packageDescriptor The package descriptor.
     */
    loadPackageDescriptor(_a) {
        return __awaiter(this, arguments, void 0, function* ({ packageName, version }) {
            // Construct the URL for the package and the save as path.
            const url = new URL(packageName + `@${version}` + `?target=${this._target}`, BASE_URL);
            const saveAsPath = path.join(this._outputFolder, packageName + '.js');
            // Log what's happening.
            console.log(`\nLoading '${url}' to '${saveAsPath}'`);
            // Load the URL.
            let contents = yield this.loadURL(url);
            // Find all the import / export dependencies and load them as dependencies.
            let matches = contents.matchAll(/((?:import|export)[^|\"]*)\"([^|\"]+)\";/g);
            for (const match of matches) {
                if (match.length !== 3) {
                    throw new Error('Invalid match length detected on import or export.');
                }
                // Get the dependency.
                let dependency = match[2];
                // If the dependency is a relative path, resolve it.
                if (dependency.startsWith('./')) {
                    dependency = path.join(url.pathname.substring(0, url.pathname.lastIndexOf('/')), dependency);
                }
                // Create the save as by stripping version and target information from the dependency.
                const saveAs = this.createSaveAs(dependency);
                // Fixup the dependency in the contents.
                contents = contents.replace(dependency, saveAs);
                // Load the dependency
                if (!this._alreadyLoadedDependencies.has(dependency)) {
                    this._alreadyLoadedDependencies.add(dependency);
                    yield this.loadDependency(0, dependency, saveAs);
                }
            }
            // Write the resource to the save as path.
            fs_1.default.writeFileSync(saveAsPath, contents);
        });
    }
    /**
     * Loads a dependency.
     * @param level The level of the dependency.
     * @param dependency The dependency to load.
     * @param saveAs
     */
    loadDependency(level, dependency, saveAs) {
        return __awaiter(this, void 0, void 0, function* () {
            // Construct the URL for the dependency and the save as path.
            let url = new URL(dependency, BASE_URL);
            const saveAsPath = path.join(this._outputFolder, saveAs);
            // Log what's happening.
            console.log(`    Loading '${url}' to '${saveAsPath}'`);
            // Load the URL.
            let contents = yield this.loadURL(url);
            // Create the directory if it does not exist.
            const saveDirectory = path.dirname(saveAsPath);
            if (!fs_1.default.existsSync(saveDirectory)) {
                fs_1.default.mkdirSync(saveDirectory, { recursive: true });
            }
            // Find all the import / export dependencies and load them.
            let matches = contents.matchAll(/((?:import|export)[^|\"]*)\"([^|\"]+)\";/g);
            for (const match of matches) {
                if (match.length === 3) {
                    // Get the dependency.
                    let dependency = match[2];
                    // If the dependency is a relative path, resolve it.
                    if (dependency.startsWith('./')) {
                        dependency = path.join(url.pathname.substring(0, url.pathname.lastIndexOf('/')), dependency);
                    }
                    const saveAs = this.createSaveAs(dependency);
                    // Fixup the dependency in the contents.
                    contents = contents.replace(dependency, saveAs);
                    // Load the dependency
                    yield this.loadDependency(level + 1, dependency, saveAs);
                }
            }
            // Write the file.
            fs_1.default.writeFileSync(saveAsPath, contents);
        });
    }
    /**
     * Creates the save as for a dependency.
     * @param dependency The dependency.
     * @returns The save as for the dependency.
     */
    createSaveAs(dependency) {
        // Create the save as by stripping version and target information from the dependency.
        let saveAs = dependency.replace(/\/(v135|stable)\//, './');
        saveAs = saveAs.replace(/@[^\/]+/, '');
        saveAs = saveAs.replace(`/${this._target}`, '');
        return saveAs;
    }
    /**
     * Loads a URL.
     * @param url The URL to load.
     * @returns The contents of the URL.
     */
    loadURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            // Load the URL.
            const response = yield fetch(url);
            let contents = yield response.text();
            // Set the comment in the contents.
            if (contents.includes('/* esm.sh ')) {
                contents = contents.replace(/\/\* esm.sh .*\*\//g, '/* eslint-disable */');
            }
            else {
                contents = `/* eslint-disable */\n${contents}`;
            }
            // Return the contents.
            return contents;
        });
    }
}
exports.PackageLoader = PackageLoader;
//# sourceMappingURL=packageLoader.js.map