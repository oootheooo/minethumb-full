<script lang="ts">
  import { startCheckoutSession } from '$lib/billing/checkout';
  import Button from './Button.svelte';
  import type { Plan, PlanId } from '$lib/types/plans';

  type SubscriptionState = {
    cancel_at_period_end: boolean;
    current_period_end: string | null;
  } | null;

  let {
    plan,
    mode = 'marketing',
    currentPlanId = 'free',
    subscription = null,
    subscriptionLoading = false,
    onCancelSubscription,
    onReactivateSubscription
  }: {
    plan: Plan;
    mode?: 'marketing' | 'checkout';
    currentPlanId?: PlanId;
    subscription?: SubscriptionState;
    subscriptionLoading?: boolean;
    onCancelSubscription?: () => void | Promise<void>;
    onReactivateSubscription?: () => void | Promise<void>;
  } = $props();

  let loading = $state(false);
  let error = $state('');

  const isCurrentPlan = $derived(currentPlanId === plan.id);
  const isPaidCurrent = $derived(isCurrentPlan && plan.id !== 'free');
  const pendingCancel = $derived(Boolean(subscription?.cancel_at_period_end));

  const buttonLabel = $derived.by(() => {
    if (isPaidCurrent) {
      return pendingCancel ? 'Keep subscription' : 'Cancel subscription';
    }

    if (plan.id === 'free') {
      return 'Included with every account';
    }

    if (plan.id === 'pro' && currentPlanId === 'creator') {
      return 'Included in Creator';
    }

    return `Upgrade to ${plan.name}`;
  });

  const buttonVariant = $derived.by(() => {
    if (isPaidCurrent && !pendingCancel) return 'danger';
    if (isPaidCurrent && pendingCancel) return 'secondary';
    if (plan.highlighted && !isButtonDisabled) return 'primary';
    return 'secondary';
  });

  const isButtonDisabled = $derived.by(() => {
    if (isPaidCurrent) return subscriptionLoading;
    if (plan.id === 'free') return true;
    if (plan.id === 'pro' && currentPlanId === 'creator') return true;
    if (isCurrentPlan) return true;
    return false;
  });

  const handleAction = async () => {
    if (isPaidCurrent) {
      if (pendingCancel) {
        await onReactivateSubscription?.();
      } else {
        await onCancelSubscription?.();
      }
      return;
    }

    if (plan.id !== 'pro' && plan.id !== 'creator') return;

    loading = true;
    error = '';

    try {
      await startCheckoutSession(plan.id);
    } catch (checkoutError) {
      error = checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.';
      loading = false;
    }
  };

  const showCheckoutButton = $derived(mode === 'checkout');
</script>

<div class="plan-card-wrap" class:current={isCurrentPlan} class:checkout={showCheckoutButton}>
  <article class="card" class:highlighted={plan.highlighted} class:current={isCurrentPlan}>
    {#if showCheckoutButton}
      {#if isCurrentPlan}
        <p class="current-plan-label">Current plan</p>
      {:else}
        <span class="current-plan-label current-plan-label--spacer" aria-hidden="true">Current plan</span>
      {/if}
    {/if}

    <div>
      <h3>{plan.name}</h3>
      <p class="price">{plan.priceUsd === 0 ? '$0' : `$${plan.priceUsd}`}<span>/mo</span></p>
      <p class="quota">{plan.generations} generations per month</p>
    </div>

    <ul>
      {#each plan.features as feature}
        <li>{feature}</li>
      {/each}
    </ul>

    {#if showCheckoutButton}
      <Button
        variant={buttonVariant}
        full
        disabled={isButtonDisabled}
        loading={loading || (isPaidCurrent && subscriptionLoading)}
        onclick={handleAction}
      >
        {buttonLabel}
      </Button>
    {:else if plan.id === 'free'}
      <Button href="/signup" variant="secondary" full>Start free</Button>
    {:else}
      <Button href="/billing" variant={plan.highlighted ? 'primary' : 'secondary'} full>
        {buttonLabel}
      </Button>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </article>
</div>

<style>
  .plan-card-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .plan-card-wrap.checkout.current {
    position: relative;
    z-index: 2;
    transform: scale(1.045);
    transform-origin: center bottom;
  }

  .current-plan-label {
    margin: 0 0 var(--space-2);
    color: var(--color-gold);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-eyebrow);
    letter-spacing: var(--tracking-wider);
    line-height: var(--leading-none);
    text-transform: uppercase;
  }

  .current-plan-label--spacer {
    visibility: hidden;
    user-select: none;
  }

  .card {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
    padding: 1.2rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .card :global(.button) {
    margin-top: auto;
  }

  .highlighted {
    border-color: rgba(239, 29, 29, 0.5);
    box-shadow: 0 0 50px rgba(239, 29, 29, 0.14);
  }

  .current {
    border-color: rgba(250, 204, 21, 0.45);
    box-shadow: var(--shadow-md);
  }

  .plan-card-wrap.checkout.current .card {
    padding: 1.35rem 1.3rem;
  }

  h3 {
    margin: 0;
    font-size: var(--text-xl);
  }

  .price {
    margin: 0.8rem 0 0;
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-body);
  }

  .price span,
  .quota {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  ul {
    display: grid;
    gap: 0.65rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    color: var(--color-text-muted);
  }

  .error {
    margin: 0;
    color: #fecaca;
    font-size: var(--text-sm);
  }
</style>
