import { Button, FoldableCard } from '@automattic/components';
import { formatCurrency } from '@automattic/number-formatters';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { translate } from 'i18n-calypso';
import { Component } from 'react';
import { connect } from 'react-redux';
import { SIGNUP_DOMAIN_ORIGIN } from 'calypso/lib/analytics/signup';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';

// Referenced from WordAds_Ads_Txt
const wpcomSubdomains = [
	'wordpress.com',
	'art.blog',
	'business.blog',
	'car.blog',
	'code.blog',
	'data.blog',
	'design.blog',
	'family.blog',
	'fashion.blog',
	'finance.blog',
	'fitness.blog',
	'food.blog',
	'game.blog',
	'health.blog',
	'home.blog',
	'law.blog',
	'movie.blog',
	'music.blog',
	'news.blog',
	'photo.blog',
	'poetry.blog',
	'politics.blog',
	'school.blog',
	'science.blog',
	'sport.blog',
	'tech.blog',
	'travel.blog',
	'video.blog',
	'water.blog',
];

export function BoldTLD( { domain } ) {
	const split = domain.split( '.' );
	let tld = split.pop();
	const wp = split.pop();

	if ( wpcomSubdomains.includes( `${ wp }.${ tld }` ) ) {
		tld = `${ wp }.${ tld }`;
	}

	return (
		<>
			<span>{ domain.replace( `.${ tld }`, '' ) }</span>
			<b>.{ tld }</b>
		</>
	);
}

export class DomainsMiniCart extends Component {
	domainNameAndCost = ( domain ) => {
		const isRemoving = this.props.domainRemovalQueue.some( ( item ) => item.meta === domain.meta );
		const formattedOriginalCost = domain.temporary
			? '...'
			: formatCurrency( domain.item_original_cost_integer ?? 0, domain.currency, {
					isSmallestUnit: true,
					stripZeros: true,
			  } );
		const formattedCost = domain.temporary
			? '...'
			: formatCurrency( domain.item_subtotal_integer ?? 0, domain.currency, {
					isSmallestUnit: true,
					stripZeros: true,
			  } );
		const priceText = translate( '%(cost)s/year', {
			args: { cost: formattedOriginalCost },
		} );
		const hasPromotion = domain.cost_overrides?.some(
			( override ) => ! override.does_override_original_cost
		);

		return isRemoving ? null : (
			<>
				<div>
					<div className="domains__domain-cart-domain">
						<BoldTLD domain={ domain.meta } />
					</div>
					<div className="domain-product-price__price">
						{ hasPromotion && <del>{ priceText }</del> }
						<span className="domains__price">{ domain.temporary ? '...' : formattedCost }</span>
					</div>
				</div>
				<div>
					{ hasPromotion && domain.item_subtotal_integer === 0 && (
						<span className="savings-message">
							{ translate( 'Free for the first year with annual paid plans.' ) }
						</span>
					) }
					<Button
						borderless
						className="domains__domain-cart-remove"
						onClick={ this.props.removeDomainClickHandler( domain ) }
						aria-label={ translate( 'Remove %(domain)s from cart', {
							args: { domain: domain.meta },
						} ) }
					>
						{ translate( 'Remove' ) }
					</Button>
				</div>
			</>
		);
	};

	domainCount = () => {
		let result = this.props.domainsInCart.length + ( this.props.wpcomSubdomainSelected ? 1 : 0 );

		// Deduct domains from the count that are on the removal queue
		this.props.domainRemovalQueue?.forEach( ( item ) => {
			if ( this.props.domainsInCart.some( ( domain ) => domain.meta === item.meta ) ) {
				result--;
			}
		} );

		return result;
	};

	freeDomain = () => {
		return (
			<div key="row-free" className="domains__domain-cart-row">
				<div>
					<div className="domains__domain-cart-domain">
						<BoldTLD domain={ this.props.wpcomSubdomainSelected.domain_name } />
					</div>
					<div className="domain-product-price__price">
						<span className="domains__price-free">{ translate( 'Free' ) }</span>
					</div>
				</div>
				<div>
					<Button
						borderless
						className="button domains__domain-cart-remove"
						onClick={ this.props.freeDomainRemoveClickHandler }
						aria-label={ translate( 'Remove %(domain)s from cart', {
							args: { domain: this.props.wpcomSubdomainSelected.domain_name },
						} ) }
					>
						{ translate( 'Remove' ) }
					</Button>
				</div>
			</div>
		);
	};

	formatCartTotal = () => {
		const isRemovingDomain = this.props.domainsInCart.some( ( domain ) =>
			this.props.domainRemovalQueue.some( ( removalItem ) => removalItem.meta === domain.meta )
		);

		const hasTemporaryDomain = this.props.domainsInCart.some( ( domain ) => domain.temporary );

		return isRemovingDomain || hasTemporaryDomain
			? '...'
			: formatCurrency(
					this.props.domainsInCart.reduce( ( total, item ) => total + item.cost, 0 ),
					this.props.domainsInCart[ 0 ]?.currency ?? this.props.userCurrency ?? 'USD'
			  );
	};

	mobile = () => {
		const MobileHeader = (
			<div className="domains__domain-cart-title">
				<div className="domains__domain-cart-total">
					<div key="rowtotal" className="domains__domain-cart-total-items">
						{ translate( '%d domain', '%d domains', {
							count: this.domainCount(),
							args: [ this.domainCount() ],
						} ) }
					</div>
					<div key="rowtotalprice" className="domains__domain-cart-total-price">
						{ this.formatCartTotal() }
					</div>
				</div>
				<Button
					primary
					className="domains__domain-cart-continue"
					onClick={ this.props.goToNext }
					disabled={ this.props.isMiniCartContinueButtonBusy }
					busy={ this.props.isMiniCartContinueButtonBusy }
				>
					{ translate( 'Continue' ) }
				</Button>
			</div>
		);

		return (
			<FoldableCard
				clickableHeader
				className="domains__domain-side-content domains__domain-cart-foldable-card"
				header={ MobileHeader }
				expanded={ false }
				hideSummary
				actionButton={
					<button className="foldable-card__action foldable-card__expand">
						<span className="screen-reader-text">More</span>
						<Icon icon={ chevronDown } viewBox="6 4 12 14" size={ 16 } />
					</button>
				}
				actionButtonExpanded={
					<button className="foldable-card__action foldable-card__expand">
						<span className="screen-reader-text">More</span>
						<Icon icon={ chevronUp } viewBox="6 4 12 14" size={ 16 } />
					</button>
				}
			>
				<div className="domains__domain-side-content domains__domain-cart">
					<div className="domains__domain-cart-rows">
						{ this.props.wpcomSubdomainSelected && this.freeDomain() }
						{ this.props.domainsInCart.map( ( domain ) => (
							<div key={ `row-${ domain.meta }` } className="domains__domain-cart-row">
								{ this.domainNameAndCost( domain ) }
							</div>
						) ) }
					</div>
				</div>
			</FoldableCard>
		);
	};

	render() {
		if ( this.props.isMobile ) {
			return this.mobile();
		}

		const shouldRenderChooseDomainLater = ! [ 'domain', 'domains/add' ].includes(
			this.props.flowName
		);

		return (
			<div className="domains__domain-side-content domains__domain-cart">
				<div className="domains__domain-cart-title">{ translate( 'Your domains' ) }</div>
				<div className="domains__domain-cart-rows">
					{ this.props.wpcomSubdomainSelected && this.freeDomain() }
					{ this.props.domainsInCart.map( ( domain ) => (
						<div key={ `row-${ domain.meta }` } className="domains__domain-cart-row">
							{ this.domainNameAndCost( domain ) }
						</div>
					) ) }
				</div>
				<div className="domains__domain-cart-total">
					<div key="rowtotal" className="domains__domain-cart-count">
						{ translate( '%d domain', '%d domains', {
							count: this.domainCount(),
							args: [ this.domainCount() ],
						} ) }
					</div>
					<div key="rowtotalprice" className="domains__domain-cart-total-price">
						<strong>{ this.formatCartTotal() }</strong>
					</div>
				</div>
				<Button
					primary
					className="domains__domain-cart-continue"
					onClick={ this.props.goToNext }
					disabled={ this.props.isMiniCartContinueButtonBusy }
					busy={ this.props.isMiniCartContinueButtonBusy }
				>
					{ translate( 'Continue' ) }
				</Button>
				{ shouldRenderChooseDomainLater && (
					<Button
						borderless
						className="domains__domain-cart-choose-later"
						onClick={ () => {
							this.props.handleSkip( undefined, false, SIGNUP_DOMAIN_ORIGIN.CHOOSE_LATER );
						} }
					>
						{ translate( 'Choose my domain later' ) }
					</Button>
				) }
			</div>
		);
	}
}

export default connect( ( state ) => ( {
	userCurrency: getCurrentUserCurrencyCode( state ),
} ) )( DomainsMiniCart );
