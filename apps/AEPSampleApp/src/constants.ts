/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// @ts-expect-error - PNG import not recognized by TypeScript
import aepLogo from './assets/aepsdk-black.png';
// @ts-expect-error - PNG import not recognized by TypeScript
import backgroundImage from './assets/aep_bg.png';

export const images = {
  aep: aepLogo,
  background: backgroundImage,
};

export const content = {
  uri: 'https://html5demos.com/assets/dizzy.mp4',
};
