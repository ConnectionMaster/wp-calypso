/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Step, StepType } from '../path';
import { STORE_KEY as ONBOARD_STORE } from '../stores/onboard';
import { useHasPaidPlanFromPath } from './use-selected-plan';

export default function useSteps(): Array< StepType > {
	const { hasSiteTitle } = useSelect( ( select ) => select( ONBOARD_STORE ) );

	let steps: StepType[];

	// If site title is skipped, we're showing Domains step before Features step. If not, we are showing Domains step next.
	steps = hasSiteTitle()
		? [
				Step.IntentGathering,
				Step.Domains,
				Step.DesignSelection,
				Step.Style,
				Step.Features,
				Step.Plans,
		  ]
		: [
				Step.IntentGathering,
				Step.DesignSelection,
				Step.Style,
				Step.Domains,
				Step.Features,
				Step.Plans,
		  ];

	// Logic necessary to skip Domains or Plans steps
	const { domain, hasUsedDomainsStep, hasUsedPlansStep } = useSelect( ( select ) =>
		select( ONBOARD_STORE ).getState()
	);
	const plan = useSelect( ( select ) => select( ONBOARD_STORE ).getPlan() );
	const hasPaidPlanFromPath = useHasPaidPlanFromPath();

	if ( domain && ! hasUsedDomainsStep ) {
		steps = steps.filter( ( step ) => step !== Step.Domains );
	}

	// Don't show the mandatory Plans step:
	// - if the user landed from a marketing page after selecting a paid plan (in this case, hide also the Features step)
	// - if a plan has been selected using the PlansModal but only if there is no Features step
	if (
		hasPaidPlanFromPath ||
		( ! steps.includes( Step.Features ) && plan && ! hasUsedPlansStep )
	) {
		steps = steps.filter( ( step ) => step !== Step.Plans && step !== Step.Features );
	}

	return steps;
}
