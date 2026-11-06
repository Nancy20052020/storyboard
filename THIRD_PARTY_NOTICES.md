# Third-party notices

Starwoven uses Google's MediaPipe Hands (`@mediapipe/hands`), distributed under the Apache License, Version 2.0. The JavaScript, WebAssembly, graph, and model assets are copied without modification from the locked npm dependency during installation and served locally. Original copyright headers are retained. The license is included at `licenses/mediapipe-APACHE-2.0.txt` and copied to `/hand-tracking/LICENSE.txt` in the deployed app.

Source: https://github.com/google-ai-edge/mediapipe

Other dependencies retain their license files in their respective packages. Floating island and botanical artwork and the immersive landscape backgrounds are bundled locally as WebP assets. The interface uses SVG/CSS included in this repository.

The bundled sky catalog is derived from [d3-celestial](https://github.com/ofrohn/d3-celestial), Copyright (c) 2015 Olaf Frohn, distributed under the BSD 3-Clause license included in `licenses/d3-celestial-BSD-3-Clause.txt`. Star positions and visual magnitudes originate in XHIP: An Extended Hipparcos Compilation, Anderson & Francis (2012), VizieR V/137D. Constellation patterns and names are from the d3-celestial data compilation; see its [data source documentation](https://github.com/ofrohn/d3-celestial/blob/master/readme.md#data-sources). The local catalog retains J2000 coordinates; the app precesses mean positions to the chosen date. No remote astronomy API is used.
