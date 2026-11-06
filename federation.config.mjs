import { withNativeFederation, fromPackageJson } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'mfe-governance',

  shared: fromPackageJson({
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto',
    build: 'package',
  })
    .patch(['@angular/*'], { includeSecondaries: { keepAll: true } })
    .override({
      '@projecthub/shared': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
      '@projecthub/ui': { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    })
    .get(),

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Tooling-only packages hoisted to the workspace root by npm. The skip
    // list only matches exact names (strings) or regex/function predicates;
    // wildcards are NOT supported, hence the regexes below.
    (pkg) => pkg.startsWith('@angular-devkit'),
    (pkg) => pkg.startsWith('@schematics/'),
    (pkg) => pkg.startsWith('source-map-support'),
    (pkg) => pkg.startsWith('oxc-parser'),
    (pkg) => pkg === '@angular/cdk/schematics',
  ],

  features: {
    denseChunking: true,
    denseExternals: true,
    strictImports: false,
  },
});