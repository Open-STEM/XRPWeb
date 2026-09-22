# Adding a Language to XRPCode

XRPCode uses [i18next](https://www.i18next.com/) for UI text and Blockly's built-in locales for standard blocks. German (`de`) is used as the example below.

## 1. Pick the language code

Use the two-letter ISO 639-1 code listed under *Supported languages* on [i18n-iso-countries](https://www.npmjs.com/package/i18n-iso-countries) (e.g. `de`, `fr`, `pt`).

## 2. Add the translation files

Create a folder under `src/utils/i18n/locales/` with two files, copied from `en/`:

```
src/utils/i18n/locales/de/
├── de.json        # everything else in the IDE (menus, dialogs, messages)
└── blockly.json   # custom XRP block labels, tooltips and toolbox categories
```

Rules:

- Translate the **values** only. Never change the keys.
- Keep placeholders like `{{ filename }}`, `{{id}}` and `\n` exactly as they are.
- `_commentXRP` does not need translating.

## 3. Register the files in `src/utils/i18n/index.ts`

```ts
import deLang from '@/utils/i18n/locales/de/de.json';
import deBlockly from '@/utils/i18n/locales/de/blockly.json';

const resources = {
    // ...
    de: {
        translation: { ...deLang, blockly: deBlockly },
    },
};
```

## 4. Register the Blockly core locale in `src/utils/blockly-locales.ts`

This translates the standard blocks (Logic, Loops, Math, ...). Check that `node_modules/blockly/msg/<code>.js` exists.

```ts
import * as DeMsg from 'blockly/msg/de';

const localeMessages = {
    // ...
    de: DeMsg,
};
```

## 5. Add it to the language picker in `src/components/dialogs/settings.tsx`

```ts
const languageOptions = [
    // ...
    { code: 'de', label: 'German', nativeName: 'Deutsch' },
];
```

## 6. Test

1. `npm run dev`, open **Settings → Language**, and select the new language.
2. Check menus, dialogs, the Blockly toolbox, and a few XRP blocks.
3. Look for text that is too long for its button or label.

## 7. Submit

Open a pull request to [Open-STEM/XRPWeb](https://github.com/Open-STEM/XRPWeb) with the new locale folder and the three code changes.
