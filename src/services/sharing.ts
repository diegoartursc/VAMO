import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { analytics } from './analytics';

/**
 * Sharing Service
 * Handles deep links and social sharing functionality
 */

const APP_SCHEME = 'vamo';
const WEB_BASE_URL = 'https://vamo.app'; // Replace with actual URL

interface ShareContent {
    title: string;
    message: string;
    url?: string;
}

class ShareService {
    /**
     * Generate deep link for a package
     */
    getPackageDeepLink(packageId: string): string {
        return Linking.createURL(`package/${packageId}`);
    }

    /**
     * Generate web URL for a package (fallback for non-app users)
     */
    getPackageWebUrl(packageId: string): string {
        return `${WEB_BASE_URL}/package/${packageId}`;
    }

    /**
     * Share a package via native share sheet
     */
    async sharePackage(
        packageId: string,
        packageTitle: string,
        destination: string,
        price: number
    ): Promise<boolean> {
        try {
            const webUrl = this.getPackageWebUrl(packageId);

            const content: ShareContent = {
                title: packageTitle,
                message: `🌍 Confira este pacote incrível no VAMO!\n\n${packageTitle}\n📍 ${destination}\n💰 A partir de R$ ${price.toLocaleString('pt-BR')}\n\n${webUrl}`,
                url: webUrl,
            };

            const result = await Share.share(
                Platform.OS === 'ios'
                    ? { title: content.title, message: content.message, url: content.url }
                    : { title: content.title, message: content.message }
            );

            if (result.action === Share.sharedAction) {
                analytics.packageShared(packageId, result.activityType || 'unknown');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error sharing package:', error);
            return false;
        }
    }

    /**
     * Share booking confirmation
     */
    async shareBookingConfirmation(
        bookingId: string,
        packageTitle: string,
        date: string
    ): Promise<boolean> {
        try {
            const content: ShareContent = {
                title: 'Minha Viagem no VAMO',
                message: `🎉 Reservei uma viagem incrível!\n\n${packageTitle}\n📅 ${date}\n\n#VAMO #Viagem`,
            };

            const result = await Share.share({
                title: content.title,
                message: content.message,
            });

            return result.action === Share.sharedAction;
        } catch (error) {
            console.error('Error sharing booking:', error);
            return false;
        }
    }

    /**
     * Open WhatsApp with pre-filled message
     */
    async openWhatsApp(phoneNumber: string, message?: string): Promise<boolean> {
        try {
            // Remove non-numeric characters
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            const encodedMessage = message ? encodeURIComponent(message) : '';
            const url = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;

            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                return true;
            } else {
                // Fallback to web WhatsApp
                const webUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
                await Linking.openURL(webUrl);
                return true;
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            return false;
        }
    }

    /**
     * Contact agency via WhatsApp
     */
    async contactAgency(
        agencyPhone: string,
        packageTitle: string,
        packageId: string
    ): Promise<boolean> {
        const message = `Olá! Tenho interesse no pacote "${packageTitle}" (ID: ${packageId}). Gostaria de mais informações.`;
        return this.openWhatsApp(agencyPhone, message);
    }

    /**
     * Handle incoming deep link
     */
    parseDeepLink(url: string): { screen: string; params: Record<string, string> } | null {
        try {
            const parsed = Linking.parse(url);

            if (!parsed.path) return null;

            const segments = parsed.path.split('/');

            // Parse package deep link: vamo://package/{id}
            if (segments[0] === 'package' && segments[1]) {
                return {
                    screen: 'package',
                    params: { id: segments[1] },
                };
            }

            // Parse booking deep link: vamo://booking/{id}
            if (segments[0] === 'booking' && segments[1]) {
                return {
                    screen: 'booking',
                    params: { id: segments[1] },
                };
            }

            return null;
        } catch (error) {
            console.error('Error parsing deep link:', error);
            return null;
        }
    }
}

export const shareService = new ShareService();
export default shareService;
