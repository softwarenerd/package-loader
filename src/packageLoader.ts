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

/**
 * PackageDescriptor interface.
 */
export interface PackageDescriptor {
    readonly packageName: string;
    readonly version: string;
}

/**
 * PackageLoader class.
 */
export class PackageLoader {
    //#region Private Properties

    /**
     * Gets the dependencies that have been already been loaded.
     */
    private readonly _alreadyLoadedDependencies = new Set<string>;

    /**
     * Gets or sets a value indicating whether the resources have been loaded.
     */
    private _resourcesLoaded = false;

    //#endregion Private Properties

    //#region Constructor

    /**
     * Constructor.
     * @param _outputFolder The output folder.
     * @param _target The target (e.g., es2022, esnext).
     */
    constructor(private readonly _outputFolder: string, private readonly _target: string) {
        console.log('PackageLoader');
    }

    //#endregion Constructor

    /**
     * Load the package descriptors.
     * @param packageDescriptors The package descriptors.
     */
    async loadPackageDescriptors(packageDescriptors: PackageDescriptor[]) {
        // Create the cleaned output folder.
        if (fs.existsSync(this._outputFolder)) {
            fs.rmSync(this._outputFolder, { recursive: true, force: true });
        }
        fs.mkdirSync(this._outputFolder);

        // Load the resources.
        for (const packageDescriptor of packageDescriptors) {
            await this.loadPackageDescriptor(packageDescriptor);
        }
    }

    //#region Private Methods

    /**
     * Loads a package descriptor.
     * @param packageDescriptor The package descriptor.
     */
    private async loadPackageDescriptor({ packageName, version }: PackageDescriptor) {
        // Construct the URL for the package and the save as path.
        const url = new URL(packageName + `@${version}` + `?target=${this._target}`, BASE_URL);
        const saveAsPath = path.join(this._outputFolder, packageName + '.js');

        // Log what's happening.
        console.log(`\nLoading '${url}' to '${saveAsPath}'`);

        // Load the URL.
        let contents = await this.loadURL(url);

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
                dependency = path.join(
                    url.pathname.substring(0, url.pathname.lastIndexOf('/')),
                    dependency
                );
            }

            // Create the save as by stripping version and target information from the dependency.
            const saveAs = this.createSaveAs(dependency);

            // Fixup the dependency in the contents.
            contents = contents.replace(dependency, saveAs);

            // Load the dependency
            if (!this._alreadyLoadedDependencies.has(dependency)) {
                this._alreadyLoadedDependencies.add(dependency);
                await this.loadDependency(0, dependency, saveAs);
            }
        }

        // Write the resource to the save as path.
        fs.writeFileSync(saveAsPath, contents);
    }

    /**
     * Loads a dependency.
     * @param level The level of the dependency.
     * @param dependency The dependency to load.
     * @param saveAs 
     */
    private async loadDependency(level: number, dependency: string, saveAs: string) {
        // Construct the URL for the dependency and the save as path.
        let url = new URL(dependency, BASE_URL);
        const saveAsPath = path.join(this._outputFolder, saveAs);

        // Log what's happening.
        console.log(`    Loading '${url}' to '${saveAsPath}'`);

        // Load the URL.
        let contents = await this.loadURL(url);

        // Create the directory if it does not exist.
        const saveDirectory = path.dirname(saveAsPath);
        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
        }

        // Find all the import / export dependencies and load them.
        let matches = contents.matchAll(/((?:import|export)[^|\"]*)\"([^|\"]+)\";/g);
        for (const match of matches) {
            if (match.length === 3) {
                // Get the dependency.
                let dependency = match[2];

                // If the dependency is a relative path, resolve it.
                if (dependency.startsWith('./')) {
                    dependency = path.join(
                        url.pathname.substring(0, url.pathname.lastIndexOf('/')),
                        dependency
                    );
                }

                const saveAs = this.createSaveAs(dependency);

                // Fixup the dependency in the contents.
                contents = contents.replace(dependency, saveAs);

                // Load the dependency
                await this.loadDependency(level + 1, dependency, saveAs);
            }
        }

        // Write the file.
        fs.writeFileSync(saveAsPath, contents);
    }

    /**
     * Creates the save as for a dependency.
     * @param dependency The dependency.
     * @returns The save as for the dependency.
     */
    private createSaveAs(dependency: string) {
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
    private async loadURL(url: URL) {
        // Load the URL.
        const response = await fetch(url);
        let contents = await response.text();

        // Set the comment in the contents.
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
