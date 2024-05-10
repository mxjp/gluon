# Tasks
The task system keeps track of pending tasks in a specific context. This is meant primarily for preventing user interaction while some operation is running.
```tsx
import { Inject } from "@mxjp/gluon";
import { TASKS, Tasks, isPending, waitFor } from "@mxjp/gluon/async";

<Inject key={TASKS} value={new Tasks()}>
  {() => <>
    <button
      // Disable this button when there are any pending tasks:
      disabled={isPending}
      $click={() => {
        // Block user interactions while some operation is running:
        waitFor(new Promise(resolve => {
          setTimeout(resolve, 1000);
        }));
      }}
    >Click me!</button>
  </>}
</Inject>
```

## Parent Tasks
`Tasks` instances can have a parent which is meant for separating contexts like the content of dialogs and popovers:
```tsx
function SomePopoverComponent(props: { children: () => unknown; }) {
  return <Inject key={TASKS} value={Tasks.fork()}>
    <props.children />
  </Inject>;
}
```
+ The child context is also considered pending if the parent has any pending tasks.
+ The parent tasks instance is unaffected by it's children.
+ `Tasks.fork` is a shorthand for `new Tasks(extract(TASKS))`.

## Error Handling
Any errors thrown by tasks will result in unhandled rejections but will not affect the task system in any other way.
