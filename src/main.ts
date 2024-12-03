/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { ESMPackageLoader } from './esmPackageLoader';

/**
 * Main function.
 */
const main = async () => {
    // Instantiate the PackageLoader.
    const packageLoader = new ESMPackageLoader(
        '/Users/brian/Desktop/esm-package-dependencies',
        'es2022'
    );

    // Load the package descriptors.
    await packageLoader.loadPackageDescriptors([
        { packageName: 'he', version: '1.2.0' },
        { packageName: 'react', version: '18.3.1' },
        { packageName: 'react-dom', version: '18.3.1' },
        { packageName: 'react-dom', version: '18.3.1', fileName: 'client' },
        { packageName: 'react-window', version: '1.8.10' },
    ]);
};

// Run the main function.
main();
