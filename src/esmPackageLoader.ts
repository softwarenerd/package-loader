/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'fs';
import * as path from 'path';

/**
 * Constants.
 */
const BASE_URL = new URL('https://esm.sh');
const IMPORT_EXPORT_REGEX = /(\bimport\b\s*(?:{[^{}]+}|.+?)\s*(?:from)?\s*['"](?<import_dependency>.*?)['"])|(\bexport\b\s*(?:.*from\s*)['"](?<export_dependency>.*?)['"])/g;

const foobar = `import ce from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/one.js";import Z from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/two.js";import ue from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/three.js";import K from"/v135/memoize-one@5.2.1/es2022/four.js";import{createElement as B,PureComponent as de}from"/stable/react@18.2.0/es2022/five.js";import re from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/six.js";let dfgdfgf = 100;`;
const yaya = `import ce from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/extends.js";import Z from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/assertThisInitialized.js";import ue from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/inheritsLoose.js";import K from"/v135/memoize-one@5.2.1/es2022/memoize-one.mjs";import{createElement as B,PureComponent as de}from"/stable/react@18.2.0/es2022/react.mjs";import re from"/v135/@babel/runtime@7.23.5/es2022/helpers/esm/objectWithoutPropertiesLoose.js";`;

/**
 * PackageDescriptor interface.
 */
export interface ESMPackageDescriptor {
    readonly packageName: string;
    readonly version: string;
    readonly fileName?: string;
}

/**
 * ESMPackageLoader class.
 */
export class ESMPackageLoader {
    //#region Private Properties

    /**
     * Gets the dependencies that have been already been loaded.
     */
    private readonly _alreadyLoadedDependencies = new Set<string>;

    //#endregion Private Properties

    //#region Constructor

    /**
     * Constructor.
     * @param _outputFolder The output folder.
     * @param _target The target (e.g., es2022, esnext).
     */
    constructor(private readonly _outputFolder: string, private readonly _target: string) {
        // Log what's happening.
        console.log('ESMPackageLoader');

        let matches = foobar.matchAll(IMPORT_EXPORT_REGEX);
        for (const match of matches) {
            console.log(`------------- ${match.groups?.import_dependency}`);
        }

        console.log('');

        matches = yaya.matchAll(IMPORT_EXPORT_REGEX);
        for (const match of matches) {
            console.log(`------------- ${match.groups?.import_dependency}`);
        }

        console.log('END');
    }

    //#endregion Constructor

    /**
     * Load the package descriptors.
     * @param packageDescriptors The package descriptors.
     */
    async loadPackageDescriptors(packageDescriptors: ESMPackageDescriptor[]) {
        // Create the cleaned output folder.
        if (fs.existsSync(this._outputFolder)) {
            fs.rmSync(this._outputFolder, { recursive: true, force: true });
        }
        fs.mkdirSync(this._outputFolder);

        // Load the resources.
        for (const packageDescriptor of packageDescriptors) {
            await this.loadPackageDescriptor(packageDescriptor)
        }
    }

    //#region Private Methods

    /**
     * Loads a package descriptor.
     * @param packageDescriptor The package descriptor.
     */
    private async loadPackageDescriptor({ packageName, version, fileName }: ESMPackageDescriptor) {
        // Construct the URL string.
        let urlString = packageName + `@${version}`;
        if (fileName) {
            urlString += `/${fileName}`;
        }
        urlString += `?target=${this._target}`;

        // Construct the URL for the package and the save as path.
        const url = new URL(urlString, BASE_URL);
        const saveAsPath = path.join(this._outputFolder, (fileName ?? packageName) + '.js');

        // Log what's happening.
        console.log(`\nLoading package '${url}' to '${saveAsPath}'`);

        // Load the URL.
        let contents = await this.loadURL(url);

        // Find all the import / export dependencies and load them as dependencies.
        const fixedDependencies = new Set<string>();
        let matches = contents.matchAll(IMPORT_EXPORT_REGEX);
        for (const match of matches) {
            // Get the dependency. If it cannot be found, throw an error.
            let dependency = match.groups?.import_dependency ?? match.groups?.export_dependency;
            if (!dependency) {
                throw new Error('Invalid match detected on import or export.');
            }

            // If the dependency has a relative path, resolve it.
            if (dependency.startsWith('./')) {
                dependency = path.join(
                    url.pathname.substring(0, url.pathname.lastIndexOf('/')),
                    dependency
                );
            }

            // Fixup the dependency in the contents.
            if (!fixedDependencies.has(dependency)) {
                fixedDependencies.add(dependency);
                contents = contents.replaceAll(dependency, `.${dependency}`);
            }

            // Load the dependency
            if (!this._alreadyLoadedDependencies.has(dependency)) {
                // Add the dependency to the already loaded dependencies.
                this._alreadyLoadedDependencies.add(dependency);

                // Load the dependency.
                await this.loadDependency(dependency);
            }
        }

        // Write the resource to the save as path.
        fs.writeFileSync(saveAsPath, contents);
    }

    /**
     * Loads a dependency.
     * @param dependency The dependency to load.
     */
    private async loadDependency(dependency: string) {
        // Construct the URL for the dependency and the save as path.
        let url = new URL(dependency, BASE_URL);
        const saveAsPath = path.join(this._outputFolder, dependency);

        // Log what's happening.
        console.log(`    Loading package dependency '${url}' to '${saveAsPath}'`);

        // Get the depth of the dependency
        const depth = path.dirname(dependency).split('/').filter(segment => segment !== '');

        // Load the URL.
        let contents = await this.loadURL(url);

        // Create the save directory, if it does not exist.
        const saveDirectory = path.dirname(saveAsPath);
        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
        }

        // Find all the import / export dependencies and load them.
        const fixedDependencies = new Set<string>();
        let matches = contents.matchAll(IMPORT_EXPORT_REGEX);
        for (const match of matches) {
            // Get the dependency. If it cannot be found, throw an error.
            let dependency = match.groups?.import_dependency ?? match.groups?.export_dependency;
            if (!dependency) {
                throw new Error('Invalid match detected on import or export.');
            }

            // If the dependency is a relative path, resolve it.
            if (dependency.startsWith('./')) {
                dependency = path.join(
                    url.pathname.substring(0, url.pathname.lastIndexOf('/')),
                    dependency
                );
            }

            // Fixup the dependency in the contents.
            if (!fixedDependencies.has(dependency)) {
                fixedDependencies.add(dependency);
                const replacement = path.join('../'.repeat(depth.length), dependency);
                contents = contents.replaceAll(dependency, replacement);
            }

            // Load the dependency
            if (!this._alreadyLoadedDependencies.has(dependency)) {
                // Add the dependency to the already loaded dependencies.
                this._alreadyLoadedDependencies.add(dependency);

                // Load the dependency.
                await this.loadDependency(dependency);
            }
        }

        // Write the file.
        fs.writeFileSync(saveAsPath, contents);
    }

    /**
     * Loads a URL.
     * @param url The URL to load.
     * @returns The contents of the URL.
     */
    private async loadURL(url: URL) {
        // Load the URL.
        const response = await fetch(url);
        let contents = await response.text();

        // Add the eslint-disable comment so we're not linting source dependencies.
        if (contents.includes('/* esm.sh ')) {
            contents = contents.replace(/\/\* esm.sh .*\*\//g, '/* eslint-disable */');
        } else {
            contents = `/* eslint-disable */\n${contents}`;
        }

        // Return the contents.
        return contents;
    }

    //#endregion Private Methods
}
