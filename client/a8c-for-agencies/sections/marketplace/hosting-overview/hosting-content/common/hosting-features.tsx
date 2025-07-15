import { sprintf } from '@wordpress/i18n';
import { code, copy, key, plus } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { useTranslate } from 'i18n-calypso';
import { BackgroundType9 } from 'calypso/a8c-for-agencies/components/page-section/backgrounds';
import HostingFeaturesSectionV2 from '../../../common/hosting-features-section-v2';

type Props = {
	heading: string;
	isPressable?: boolean;
	areSignaturePlans?: boolean;
};

export default function HostingFeatures( { heading, isPressable, areSignaturePlans }: Props ) {
	const translate = useTranslate();
	const { __ } = useI18n();

	return (
		<HostingFeaturesSectionV2
			heading={ heading }
			subheading={ translate( 'World-class functionality' ) }
			background={ BackgroundType9 }
			features={ [
				{
					icon: copy,
					title: translate( 'Performance' ),
					items: [
						translate( 'Global edge caching' ),
						translate( 'Global CDN with 28+ locations' ),
						translate( 'High-frequency CPUs' ),
						translate( 'High-burst capacity' ),
						translate( 'Automated datacenter failover' ),
						translate( 'Extremely fast DNS with SSL' ),
						sprintf(
							/* translators: %s is the number of PHP workers */
							__( '%s PHP workers w/ auto-scaling' ),
							areSignaturePlans ? '5' : '10'
						),
						translate( 'Uptime monitoring' ),
					],
				},
				{
					icon: key,
					title: translate( 'Security' ),
					items: [
						translate( 'Real-time backups' ),
						translate( 'DDOS protection and mitigation' ),
						translate( 'Brute-force protection' ),
						translate( 'Malware detection & removal' ),
						translate( 'Spam protection with Akismet' ),
						translate( 'Web application firewall (WAF)' ),
						translate( 'One-click restores' ),
						translate( 'Automated WordPress updates' ),
						translate( 'Isolated site infrastructure' ),
					],
				},
				{
					icon: code,
					title: translate( 'Dev tools' ),
					items: [
						translate( 'Local development environment' ),
						translate( 'Free staging site' ),
						translate( 'WP-CLI access' ),
						translate( 'SSH/SFTP access' ),
						translate( 'GitHub deployments' ),
						translate( 'Plugin auto-updates' ),
						translate( 'Centralized site management' ),
						translate( 'Domain management' ),
						translate( 'Site activity log' ),
					],
				},
				{
					icon: plus,
					title: translate( 'And more!' ),
					items: [
						translate( '24/7 priority expert support' ),
						translate( 'Free managed migrations' ),
						translate( 'Install plugins and themes' ),
						translate( 'In-depth site analytics dashboard' ),
						translate( 'Elastic-powered search' ),
						translate( '4K, unbranded VideoPress player' ),
						...( isPressable ? [] : [ translate( 'Free domain for one year' ) ] ),
						translate( 'Smart redirects' ),
					],
				},
			] }
		/>
	);
}
