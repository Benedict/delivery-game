<script>
  import { createEventDispatcher } from 'svelte';

  export let show = false;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={close}>
    <div class="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <!-- Header -->
      <div class="bg-gradient-to-r from-violet-500 to-purple-500 border-b-4 border-black p-6">
        <div class="flex justify-between items-center">
          <h2 class="text-3xl font-black text-white uppercase">How to Play</h2>
          <button on:click={close} class="text-white hover:text-gray-200 text-4xl font-black leading-none">&times;</button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Goal -->
        <section>
          <h3 class="text-2xl font-black text-black mb-3 uppercase">🎯 Goal</h3>
          <p class="text-base font-bold text-gray-700 leading-relaxed">
            Balance delivering features for business value with maintaining code quality. Meet your scenario's victory conditions before time runs out!
          </p>
        </section>

        <!-- Flow Efficiency -->
        <section class="bg-blue-50 border-2 border-black p-4">
          <h3 class="text-xl font-black text-black mb-3 uppercase">⚡ Flow Efficiency</h3>
          <p class="text-sm font-bold text-gray-700 mb-3 leading-relaxed">
            Flow efficiency determines how much work your team can accomplish each week. It's calculated from your code health:
          </p>
          <div class="bg-white border-2 border-black p-3 space-y-1 text-xs font-black">
            <div class="flex justify-between"><span>Code Health ≥ 80:</span> <span class="text-green-700">90% efficient ✨</span></div>
            <div class="flex justify-between"><span>Code Health 50-79:</span> <span class="text-green-600">80% efficient</span></div>
            <div class="flex justify-between"><span>Code Health 20-49:</span> <span class="text-yellow-600">70% efficient</span></div>
            <div class="flex justify-between"><span>Code Health 0-19:</span> <span class="text-orange-600">60% efficient</span></div>
            <div class="flex justify-between"><span>Code Health -20 to -1:</span> <span class="text-red-600">50% efficient</span></div>
            <div class="flex justify-between"><span>Code Health &lt; -20:</span> <span class="text-red-700">40% efficient 💀</span></div>
          </div>
          <p class="text-sm font-black text-gray-700 mt-3 bg-amber-100 border-2 border-black p-2">
            📊 Weekly Capacity = Base Capacity × Flow Efficiency
          </p>
          <p class="text-xs font-bold text-gray-600 mt-2 leading-relaxed">
            Example: 100 capacity with healthy code (90%) = 90 points/week. With poor code (40%) = only 40 points/week. That's a 2.25x difference!
          </p>
        </section>

        <!-- Gameplay Loop -->
        <section>
          <h3 class="text-xl font-black text-black mb-3 uppercase">🔄 Each Week</h3>
          <ol class="space-y-2 text-sm font-bold text-gray-700 leading-relaxed list-decimal list-inside">
            <li><strong>Start features or improvements</strong> - Choose what to work on</li>
            <li><strong>Allocate capacity</strong> - Use sliders to assign team effort</li>
            <li><strong>End week</strong> - See results and new opportunities</li>
            <li><strong>Repeat</strong> - Balance speed with quality!</li>
          </ol>
        </section>

        <!-- Features vs Improvements -->
        <section>
          <h3 class="text-xl font-black text-black mb-3 uppercase">⚔️ Features vs Improvements</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gradient-to-br from-sky-300 to-cyan-400 border-2 border-black p-3">
              <h4 class="font-black text-black mb-2 text-sm uppercase">🎯 Features</h4>
              <ul class="text-xs font-bold text-black space-y-1 leading-tight">
                <li>+ Add business value</li>
                <li>+ Increase satisfaction (if no bugs)</li>
                <li>- Degrade code health</li>
                <li>- Risk bugs if code health is low</li>
              </ul>
            </div>
            <div class="bg-gradient-to-br from-emerald-300 to-teal-400 border-2 border-black p-3">
              <h4 class="font-black text-black mb-2 text-sm uppercase">🔧 Improvements</h4>
              <ul class="text-xs font-bold text-black space-y-1 leading-tight">
                <li>+ Improve code health</li>
                <li>+ May increase capacity</li>
                <li>+ Increase satisfaction</li>
                <li>- Take time away from features</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Context Switching -->
        <section class="bg-yellow-50 border-2 border-black p-4">
          <h3 class="text-xl font-black text-black mb-3 uppercase">🔀 Context Switching</h3>
          <p class="text-sm font-bold text-gray-700 mb-2 leading-relaxed">
            Working on too many things at once reduces efficiency:
          </p>
          <div class="bg-white border-2 border-black p-3 space-y-1 text-xs font-black">
            <div class="flex justify-between"><span>1 item:</span> <span class="text-green-700">100% efficiency</span></div>
            <div class="flex justify-between"><span>2 items:</span> <span class="text-green-600">95% efficiency</span></div>
            <div class="flex justify-between"><span>3 items:</span> <span class="text-yellow-600">85% efficiency</span></div>
            <div class="flex justify-between"><span>4+ items:</span> <span class="text-orange-600">70% efficiency</span></div>
          </div>
          <p class="text-xs font-bold text-gray-600 mt-2 leading-relaxed">
            Focus your team's effort on fewer items to maximize progress!
          </p>
        </section>

        <!-- Events -->
        <section>
          <h3 class="text-xl font-black text-black mb-3 uppercase">⚡ Events</h3>
          <p class="text-sm font-bold text-gray-700 mb-2 leading-relaxed">
            Your decisions trigger events that can help or hurt:
          </p>
          <ul class="text-xs font-bold text-gray-700 space-y-2 leading-relaxed">
            <li class="bg-red-100 border-2 border-black p-2">
              <strong>🚨 Security Incident (Code Health &lt; -50):</strong> Forces 2-week emergency fix, blocks all other work
            </li>
            <li class="bg-red-100 border-2 border-black p-2">
              <strong>💔 Customer Churn (Satisfaction &lt; 20):</strong> Lose business value and market position
            </li>
            <li class="bg-red-100 border-2 border-black p-2">
              <strong>🏃 Engineering Exodus (Code Health &lt; 10 for 3+ weeks):</strong> Engineers quit, lose capacity
            </li>
            <li class="bg-green-100 border-2 border-black p-2">
              <strong>✨ Big Client (Market Position &gt; 70):</strong> Unlock high-value enterprise deal
            </li>
          </ul>
        </section>

        <!-- Strategy Tips -->
        <section class="bg-violet-50 border-2 border-black p-4">
          <h3 class="text-xl font-black text-black mb-3 uppercase">💡 Strategy Tips</h3>
          <ul class="text-sm font-bold text-gray-700 space-y-2 leading-relaxed list-disc list-inside">
            <li>Don't let code health drop too low - you'll slow down dramatically</li>
            <li>Fix bugs early before they compound</li>
            <li>Invest in improvements when you can afford the time</li>
            <li>Focus on fewer items to avoid context switching penalties</li>
            <li>Watch for deadlines on features - expired opportunities are lost</li>
            <li>Balance is key - all features or all improvements both lead to failure!</li>
          </ul>
        </section>

        <!-- Real World Application -->
        <section class="bg-gradient-to-br from-amber-100 to-yellow-100 border-4 border-black p-5">
          <h3 class="text-2xl font-black text-black mb-4 uppercase">🌍 Real World: Improving Your Team</h3>

          <div class="space-y-4">
            <div>
              <h4 class="text-lg font-black text-black mb-2">📈 Improve Flow Efficiency</h4>
              <ul class="text-sm font-bold text-gray-700 space-y-1 leading-relaxed list-disc list-inside ml-2">
                <li><strong>Reduce WIP limits:</strong> Limit work-in-progress per person/team (Kanban principle)</li>
                <li><strong>Minimize interruptions:</strong> Create focus time blocks, batch meetings</li>
                <li><strong>Automate testing:</strong> Fast CI/CD pipelines catch issues early</li>
                <li><strong>Remove blockers quickly:</strong> Daily standups to identify and resolve impediments</li>
                <li><strong>Improve onboarding:</strong> Reduce ramp-up time for new engineers</li>
              </ul>
            </div>

            <div>
              <h4 class="text-lg font-black text-black mb-2">🏥 Improve Code Health</h4>
              <ul class="text-sm font-bold text-gray-700 space-y-1 leading-relaxed list-disc list-inside ml-2">
                <li><strong>Pair programming:</strong> Share knowledge, catch bugs early, improve design</li>
                <li><strong>Code reviews:</strong> Enforce standards, spread knowledge, maintain quality</li>
                <li><strong>Refactor regularly:</strong> Don't wait - small improvements compound</li>
                <li><strong>Write tests first (TDD):</strong> Better design, confidence to change code</li>
                <li><strong>Monitor technical debt:</strong> Track code metrics, prioritize improvements</li>
                <li><strong>Document decisions:</strong> ADRs (Architecture Decision Records) prevent confusion</li>
              </ul>
            </div>

            <div>
              <h4 class="text-lg font-black text-black mb-2">⚖️ Balance Features & Quality</h4>
              <ul class="text-sm font-bold text-gray-700 space-y-1 leading-relaxed list-disc list-inside ml-2">
                <li><strong>20% time rule:</strong> Reserve ~20% capacity for tech debt/improvements</li>
                <li><strong>Include improvements in sprints:</strong> Make them visible, not "extra work"</li>
                <li><strong>Measure velocity impact:</strong> Show leadership how debt slows delivery</li>
                <li><strong>Scout rule:</strong> "Leave code better than you found it" on every change</li>
                <li><strong>Architectural spikes:</strong> Invest upfront in critical technical decisions</li>
              </ul>
            </div>

            <div>
              <h4 class="text-lg font-black text-black mb-2">📊 Measure What Matters</h4>
              <ul class="text-sm font-bold text-gray-700 space-y-1 leading-relaxed list-disc list-inside ml-2">
                <li><strong>DORA metrics:</strong> Deployment frequency, lead time, MTTR, change failure rate</li>
                <li><strong>Cycle time:</strong> Time from code start to production (aim to reduce)</li>
                <li><strong>Bug escape rate:</strong> How many bugs reach production vs caught in dev</li>
                <li><strong>Team happiness:</strong> Survey regularly - unhappy teams produce poor code</li>
                <li><strong>Code coverage:</strong> Not perfect, but trends show investment in quality</li>
              </ul>
            </div>

            <div>
              <h4 class="text-lg font-black text-black mb-2">🎯 Cultural Practices</h4>
              <ul class="text-sm font-bold text-gray-700 space-y-1 leading-relaxed list-disc list-inside ml-2">
                <li><strong>Blameless retrospectives:</strong> Learn from incidents without punishment</li>
                <li><strong>Psychological safety:</strong> Team members can admit mistakes, ask questions</li>
                <li><strong>Celebrate refactoring:</strong> Recognize improvements, not just features</li>
                <li><strong>Educate stakeholders:</strong> Help leadership understand debt's business impact</li>
                <li><strong>Senior engineers mentor:</strong> Level up the whole team, compound knowledge</li>
              </ul>
            </div>

            <div class="bg-white border-2 border-black p-3 mt-4">
              <p class="text-sm font-black text-gray-800 leading-relaxed">
                💎 <strong>Key Insight:</strong> Technical debt isn't just a code problem—it's a business problem. Slow delivery, bugs, and team attrition all hurt the bottom line. Frame quality improvements as business investments, not "nice to haves."
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="border-t-4 border-black p-4 bg-gray-100">
        <button
          on:click={close}
          class="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:from-violet-600 hover:to-purple-600 transition-colors font-black uppercase"
        >
          Got It!
        </button>
      </div>
    </div>
  </div>
{/if}
