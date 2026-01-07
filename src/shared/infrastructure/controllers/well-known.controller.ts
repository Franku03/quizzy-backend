import { Controller, Get, Header } from '@nestjs/common';

@Controller('.well-known')
export class WellKnownController {

    @Get('assetlinks.json')
    @Header('Content-Type', 'application/json')
    getAssetLinks() {
        return [
            {
                "relation": ["delegate_permission/common.handle_all_urls"],
                "target": {
                    "namespace": "android_app",
                    "package_name": "com.example.kahoot",
                    "sha256_cert_fingerprints": [
                        "DF:DF:4E:19:98:68:04:C7:2B:D6:B2:07:DA:76:A6:5E:0D:93:C2:99:6F:64:CC:78:28:E2:99:DC:58:8C:A9:B4" // <--- La firma SHA-256 que te dieron
                    ]
                }
            }
        ];
    }
}