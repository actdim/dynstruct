# Glossary

_Domain terms. Add a term when you introduce or clarify it._

<!-- - **Term** - definition. -->

- **Initial-value param** - a plain (non-binding) value in `params`: applied to the model once, at creation; later changes are not applied (DEV warning).
- **Live binding** - a `Binding` (`bindProp` / `bind`) in `params`: the model reads (and with a setter writes) through it; the only live input channel.
- **Service params** - `$events`, `$id`, `$key`: never stored in the model; `$events` are refreshed on every commit, a new `$key` recreates the instance.
- **React boundary prop** - a prop of a `toReact` component or a JSX prop of a factory child: kept live via a per-instance observable map and exposed as a read-only binding; controlled by the React parent while defined, `undefined` falls back to the model value.
