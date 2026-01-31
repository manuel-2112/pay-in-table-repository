# XState Payment Coordination

This directory contains the XState configuration for coordinating multiple payments in real-time using the actor pattern.

## Architecture

The payment coordination system uses XState actors to manage the state of individual payments, while Convex handles persistence and real-time synchronization across clients.

### Components

1. **Types** (`types.ts`): TypeScript types for payment actors, contexts, and events
2. **Payment Machine** (`paymentMachine.ts`): XState state machine definition for payment coordination
3. **Payment Coordinator** (`paymentCoordinator.ts`): Manages multiple payment actors
4. **React Provider** (`PaymentActorProvider.tsx`): React context provider for accessing payment actors
5. **Hooks**:
   - `usePaymentActor.ts`: Hook to subscribe to payment actor state
   - `useConvexPaymentSync.ts`: Hook to sync actor state with Convex
   - `usePaymentWithConvex.ts`: Combined hook for actor + Convex synchronization

## Usage

### Basic Setup

The `PaymentActorProvider` is already integrated in `main.tsx`. You can use payment actors in any component:

```tsx
import { usePaymentWithConvex } from "@/lib/xstate";

function PaymentComponent({ paymentId }: { paymentId: string }) {
  const { state, send, convexPayment, isSyncing } = usePaymentWithConvex({
    paymentId,
  });

  if (!state) return <div>Loading...</div>;

  return (
    <div>
      <p>Status: {state.value}</p>
      <p>Amount: ${state.context.amount}</p>
      <button onClick={() => send({ type: "PROCESS_PAYMENT" })}>
        Process Payment
      </button>
    </div>
  );
}
```

### Creating a Payment Actor

```tsx
import { usePaymentActorContext } from "@/lib/xstate";

function CreatePayment() {
  const { createPaymentActor } = usePaymentActorContext();

  const handleCreate = () => {
    const actor = createPaymentActor("payment-123", {
      paymentId: "payment-123",
      amount: 100,
      currency: "USD",
      participants: [
        { id: "user-1", name: "Alice", amount: 50, status: "pending" },
        { id: "user-2", name: "Bob", amount: 50, status: "pending" },
      ],
    });

    // Initialize the payment
    actor.send({
      type: "INITIALIZE",
      paymentId: "payment-123",
      amount: 100,
      currency: "USD",
      participants: [
        { id: "user-1", name: "Alice", amount: 50, status: "pending" },
        { id: "user-2", name: "Bob", amount: 50, status: "pending" },
      ],
    });
  };

  return <button onClick={handleCreate}>Create Payment</button>;
}
```

### Payment States

The payment machine has the following states:

- **idle**: Initial state, waiting for initialization
- **initializing**: Payment is being set up
- **collecting**: Waiting for all participants to pay
- **processing**: Processing the payment
- **completed**: Payment completed successfully
- **failed**: Payment failed
- **cancelled**: Payment was cancelled

### Events

- `INITIALIZE`: Initialize a new payment
- `PARTICIPANT_PAID`: Mark a participant as paid
- `PARTICIPANT_FAILED`: Mark a participant payment as failed
- `PROCESS_PAYMENT`: Process the payment (only if all participants paid)
- `COMPLETE_PAYMENT`: Complete the payment
- `FAIL_PAYMENT`: Fail the payment
- `CANCEL_PAYMENT`: Cancel the payment
- `SYNC_STATE`: Sync state from Convex

## Convex Integration

The system automatically syncs payment state with Convex:

- **Actor → Convex**: When actor state changes, it's persisted to Convex
- **Convex → Actor**: When Convex state changes (from other clients), it updates the actor

This enables real-time coordination across multiple clients.

## Example: Coordinating Multiple Payments

```tsx
import { usePaymentActorContext } from "@/lib/xstate";

function PaymentCoordinator() {
  const { coordinator } = usePaymentActorContext();

  // Get all active payment actors
  const allPayments = coordinator.getAllActors();

  return (
    <div>
      <h2>Active Payments: {allPayments.length}</h2>
      {allPayments.map((actor) => (
        <PaymentView key={actor.id} paymentId={actor.id} />
      ))}
    </div>
  );
}
```
