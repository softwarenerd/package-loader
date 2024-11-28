"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const packageLoader_1 = require("./packageLoader");
/**
 * Main function.
 */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    // Instantiate the PackageLoader.
    const packageLoader = new packageLoader_1.PackageLoader('/Users/brian/Work/positron-tryreact19/src/package-dependencies', 'es2022');
    // Load the package descriptors.
    yield packageLoader.loadPackageDescriptors([
        { packageName: 'he', version: '1.2.0' },
        { packageName: 'react', version: '19.0.0-rc.1' },
        { packageName: 'react-dom', version: '19.0.0-rc.1' },
        // { name: 'react-dom@19.0.0-rc.1/client', outputFolder: 'react-dom/client', saveAs: 'client.js' },
    ]);
});
// Run the main function.
main();
//# sourceMappingURL=main.js.map