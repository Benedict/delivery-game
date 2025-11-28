<script>
  export let dice = [];
  export let label = '';
  export let color = 'gray';
  export let showTotal = false;

  $: total = dice.reduce((sum, die) => sum + die, 0);

  const colorClasses = {
    blue: 'bg-blue-500 border-blue-700',
    red: 'bg-red-500 border-red-700',
    gray: 'bg-gray-500 border-gray-700',
    green: 'bg-green-500 border-green-700'
  };

  $: bgColor = colorClasses[color] || colorClasses.gray;
</script>

<div class="dice-container">
  {#if label}
    <h3 class="text-sm font-semibold mb-2 text-gray-700">{label}</h3>
  {/if}

  <div class="flex flex-wrap gap-2 items-center">
    {#each dice as die}
      <div class="die w-12 h-12 {bgColor} border-2 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
        {die}
      </div>
    {/each}

    {#if showTotal && dice.length > 0}
      <div class="ml-4 text-lg font-bold text-gray-800">
        Total: {total}
      </div>
    {/if}
  </div>
</div>

<style>
  .dice-container {
    margin-bottom: 1rem;
  }
</style>
