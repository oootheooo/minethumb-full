<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { manageSubscription } from '$lib/billing/subscription';
  import PricingCard from '$lib/components/PricingCard.svelte';
  import { plans } from '$lib/types/plans';

  let { data } = $props();

  let subscriptionLoading = $state(false);
  let error = $state('');
  let notice = $state('');

  function formatDate(value: string | null | undefined) {
    if (!value) return null;

    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(value));
  }

  const handleCancel = async () => {
    if (
      !confirm(
        'Cancel your subscription? You will keep your current plan and credits until the end of the billing period.'
      )
    ) {
      return;
    }

    subscriptionLoading = true;
    error = '';
    notice = '';

    try {
      const result = await manageSubscription('cancel');
      notice = result.cancel_at_period_end
        ? `Subscription cancelled. Access continues until ${formatDate(result.current_period_end) ?? 'the end of your billing period'}.`
        : 'Subscription updated.';
      await invalidateAll();
    } catch (subscriptionError) {
      error =
        subscriptionError instanceof Error
          ? subscriptionError.message
          : 'Could not cancel subscription.';
    } finally {
      subscriptionLoading = false;
    }
  };

  const handleReactivate = async () => {
    subscriptionLoading = true;
    error = '';
    notice = '';

    try {
      await manageSubscription('reactivate');
      notice = 'Subscription renewed. Your plan will continue after the current billing period.';
      await invalidateAll();
    } catch (subscriptionError) {
      error =
        subscriptionError instanceof Error
          ? subscriptionError.message
          : 'Could not reactivate subscription.';
    } finally {
      subscriptionLoading = false;
    }
  };
</script>

<svelte:head><title>Billing | MineThumb</title></svelte:head>

<section class="billing">
  <header>
    <span class="eyebrow">Plans & Billing</span>
    <h1>Choose the thumbnail capacity that matches your channel.</h1>
    {#if data.checkoutStatus === 'success'}
      <p class="success">Payment received. Your plan and credits will update in a moment.</p>
    {:else if data.checkoutStatus === 'cancelled'}
      <p class="notice">Checkout cancelled. You can upgrade whenever you are ready.</p>
    {:else if notice}
      <p class="success">{notice}</p>
    {:else if error}
      <p class="error">{error}</p>
    {/if}
  </header>

  <div class="plans">
    {#each plans as plan}
      <PricingCard
        {plan}
        mode="checkout"
        currentPlanId={data.currentPlanId}
        subscription={data.subscription}
        {subscriptionLoading}
        onCancelSubscription={handleCancel}
        onReactivateSubscription={handleReactivate}
      />
    {/each}
  </div>
</section>

<style>
  .billing {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  header {
    width: min(56rem, 100%);
    margin-bottom: var(--space-6);
    text-align: center;
  }

  h1 {
    margin: var(--space-2) auto 0;
    max-width: 100%;
    font-size: clamp(1.2rem, 2.1vw, 1.85rem);
    line-height: var(--leading-snug);
    white-space: nowrap;
  }

  .success,
  .notice,
  .error {
    margin: var(--space-3) auto 0;
    max-width: 36rem;
    font-size: var(--text-sm);
  }

  .success {
    color: var(--color-minecraft-green);
  }

  .notice {
    color: var(--color-text-muted);
  }

  .error {
    color: #fecaca;
  }

  .plans {
    display: grid;
    width: min(56rem, 100%);
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
    gap: var(--space-4);
    padding-top: var(--space-2);
    overflow: visible;
  }

  @media (max-width: 980px) {
    h1 {
      white-space: normal;
    }

    .plans {
      grid-template-columns: 1fr;
    }
  }
</style>
