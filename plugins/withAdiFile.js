const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAdiFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/assets/adi-registration.properties'
      );

      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // Write EXACT content (no newline)
      fs.writeFileSync(filePath, 'D4KVXVG6T6CNIAAAAAAAAAAAAA');

      return config;
    },
  ]);
};