# API Questions

These questions should be answered before locking the V2 public surface.

## Dependency DSL

1. Should dependencies stay declarative data, or become helper-based builder calls?
2. Do we want a single `dependencies` property, or separate `reads` and `writes` concepts?
3. Should alias names always be explicit, or can single-source shorthand still exist?
4. Should the dependency declaration surface allow callback-based accessors as an escape hatch?
5. Do we want to preserve `$root`-like semantics explicitly, or replace them with a named helper like `root(...)`?

## Scope Model

6. What is the canonical meaning of "parent" in nested groups vs objects vs array items?
7. Should ancestor traversal be zero-based or one-based in the public helper surface?
8. Do we expose ancestor depth directly, or prefer repeated helper composition?
9. Should fields be allowed to reference any previous field in the same scope, or only direct siblings?
10. Do step roots count as a scope boundary in the dependency model?

## Ordering Rules

11. Do we want "previously defined only" as a hard rule everywhere?
12. If yes, should V2 statically reject forward references where possible?
13. For object/group/array children, is "previously defined" evaluated per local scope only?
14. Do we need a migration escape hatch for rare legacy forward-like patterns?

## Arrays And Variants

15. How much of the legacy array system do we want in the first stable V2?
16. Do `array-list` and `array-tabs` remain separate field types, or become one array field with display variants?
17. Should `array-variant` remain a first-class field type?
18. If polymorphic arrays stay, how far do we want type-safe dependency resolution across variant-specific child fields?
19. Do virtual fields stay part of the public API?

## Group/Object Semantics

20. Should `group` and `object` remain distinct concepts?
21. If they remain distinct, what is the exact difference in V2:
   visual grouping, layout, transform semantics, field-kind restrictions, or all of the above?
22. The legacy `group` field restricts child field kinds more than `object`. Do we want to keep that constraint?
23. Should group/object wrappers own any extra state, or only scope child state?

## Transforms And Data Model

24. Do we keep both `preformat` and `transform`, or rename them to more explicit phases?
25. Should transform typing continue to directly affect output inference?
26. Should dependency reads target:
   raw input shape, current internal form shape, or transformed output shape?
27. For fields like grouped editable wrappers, do dependencies see the wrapper object or only its transformed output?

## Typed API Surface

28. Should `api.getValue` and `api.setValue` accept only typed absolute paths, or also typed relative helpers?
29. Should `api.getOptions` become typed by field path, field key, or both?
30. Do we want a typed `api.field("path")` sub-API to reduce string repetition?
31. Should field callbacks receive a richer typed context object than just `{ deps, api }`?

## Validation

32. Should validation continue to be field-driven and Vuelidate-oriented internally, or be abstracted sooner?
33. Should required/condition/validators all use the same typed dependency context?
34. How should custom errors be typed and scoped in nested structures?

## Options

35. Do we keep the current unified option model for static and async sources?
36. Should create-option remain part of field config, or move into a more explicit option-capability layer?
37. How should options invalidation references be typed?
38. Can options refresh/invalidation be modeled without leaking raw path strings?

## Async Resolvers

39. What should the public async resolver contract look like when both of these must be supported:
   plain promises and TanStack Query?
40. Where should TanStack-specific affordances live:
   directly in schema, in helper wrappers, or behind adapters over a normalized async resolver contract?
41. Which async surfaces need this dual support on day one:
   options, create-option, dependency reactions, initial data hydration, or all of them?

## Renderer And Runtime Split

42. How headless do we want V2 to be initially?
43. Do we build the state engine first and renderers second, like the current table direction?
44. Are field components part of the initial V2 milestone, or should the first milestone stop at schema/state contracts?

## Field Property Ownership

45. Which properties are truly global across almost all field kinds?
46. Which properties should move into capability-specific layers instead of living on the generic base field?
47. Do we want field contracts composed from capabilities such as:
   `conditional`, `option-bearing`, `actionable`, `structural`, `transformable`?
48. Which current legacy properties are actually implementation residue and should disappear from the public surface?
49. How should global field defaults be declared:
   form-level config, provider-level config, module-level config, or all three?
50. Should global field defaults support per-field-kind overrides?

## Compatibility And Migration

51. Are we explicitly comfortable breaking backward compatibility for the form DSL, as was done in `typed-xlsx` planning?
52. If yes, which legacy ideas are non-negotiable to preserve:
   stepped forms, arrays, typed output, create-option, dependency-driven conditions?
53. Do we need any temporary migration notes or compatibility wrappers, or should V2 be clean-slate only?

## Documentation And Teaching

54. What is the one-sentence mental model we want consumers to learn first?
55. Can the dependency system be explained without mentioning implementation details like path parsing or internal scopes?
56. What are the minimum examples that must exist before we consider the public API teachable?

## My current bias

These are the answers the current analysis leans toward:

- use a clean-slate V2 dependency DSL
- make scope explicit and directional
- keep previous-only local references as a hard rule
- preserve ancestor access, but with named typed helpers
- keep the field registry model
- support both TanStack Query and plain promise async resolvers
- introduce a real global field property/default system
- split field contracts more sharply by capability
- preserve `preformat` plus `transform`, but likely under clearer names
- avoid trying to make polymorphic nested dependency typing infinitely magical
- keep one explicit typed escape hatch for exceptional cases
