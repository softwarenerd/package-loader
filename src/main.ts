/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { PackageLoader } from './packageLoader';

/**
 * Main function.
 */
const main = async () => {
    // Instantiate the PackageLoader.
    const packageLoader = new PackageLoader(
        '/Users/brian/Work/positron-tryreact19/src/package-dependencies',
        'es2022'
    );

    // Load the package descriptors.
    await packageLoader.loadPackageDescriptors([
        { packageName: 'he', version: '1.2.0' },
        { packageName: 'react', version: '19.0.0-rc.1'},
        { packageName: 'react-dom', version: '19.0.0-rc.1' },
        // { name: 'react-dom@19.0.0-rc.1/client', outputFolder: 'react-dom/client', saveAs: 'client.js' },
    ]);
};

// Run the main function.
main();
