import { formatCurrency } from '@automattic/number-formatters';
import { useTranslate } from 'i18n-calypso';
import {
	ConsolidatedStatsCard,
	ConsolidatedStatsGroup,
} from 'calypso/a8c-for-agencies/components/consolidated-stats-card';
import { AGENCY_EARNINGS_LEARN_MORE_LINK } from 'calypso/a8c-for-agencies/constants';
import useProductsQuery from 'calypso/a8c-for-agencies/data/marketplace/use-products-query';
import useGetConsolidatedPayoutData from '../hooks/use-get-consolidated-payout-data';
import PayoutCards from './payout-cards';
import type { Referral } from '../types';

type ConsolidatedViewsProps = {
	referrals: Referral[];
	totalPayouts?: number;
};

export default function ConsolidatedViews( { referrals, totalPayouts }: ConsolidatedViewsProps ) {
	const translate = useTranslate();
	const { data: productsData, isFetching } = useProductsQuery( false, false, true );
	const { previousQuarterExpectedCommission, pendingOrders, currentQuarterExpectedCommission } =
		useGetConsolidatedPayoutData( referrals, productsData );

	return (
		<ConsolidatedStatsGroup className="consolidated-view">
			{ totalPayouts !== undefined && (
				<ConsolidatedStatsCard
					value={ formatCurrency( totalPayouts, 'USD' ) }
					footerText={ translate( 'All time referral payouts' ) }
					popoverTitle={ translate( 'Total payouts' ) }
					popoverContent={ translate(
						'The exact amount your agency has been paid out for referrals.' +
							'{{br/}}{{br/}}{{a}}Learn more{{/a}} ↗',
						{
							components: {
								a: (
									<a
										href={ AGENCY_EARNINGS_LEARN_MORE_LINK }
										target="_blank"
										rel="noreferrer noopener"
									/>
								),
								br: <br />,
							},
						}
					) }
				/>
			) }
			<PayoutCards
				isFetching={ isFetching }
				previousQuarterExpectedCommission={ previousQuarterExpectedCommission }
				currentQuarterExpectedCommission={ currentQuarterExpectedCommission }
			/>
			<ConsolidatedStatsCard
				value={ pendingOrders }
				footerText={ translate( 'Pending referral orders' ) }
				popoverTitle={ translate( 'Pending orders' ) }
				popoverContent={ translate(
					'These are the number of pending referrals (unpaid carts). ' +
						'{{br/}}{{br/}}{{a}}Learn more{{/a}} ↗',
					{
						components: {
							a: (
								<a
									href={ AGENCY_EARNINGS_LEARN_MORE_LINK }
									target="_blank"
									rel="noreferrer noopener"
								/>
							),
							br: <br />,
						},
					}
				) }
				isLoading={ isFetching }
			/>
		</ConsolidatedStatsGroup>
	);
}
