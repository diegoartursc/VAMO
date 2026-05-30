import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { openExternalUrl } from '../utils/externalLinks';
import { formatMoney } from '@vamo/shared/itinerary';

/**
 * Sharing Service
 * Handles deep links and social sharing functionality for digital itineraries.
 */

const APP_SCHEME = 'vamo';
const WEB_BASE_URL = 'https://vamo.app'; // Replace with actual URL

interface ShareContent {
    title: string;
    message: string;
    url?: string;
}

class ShareService {
    getItineraryDeepLink(itineraryId: string): string {
        return Linking.createURL(`itinerary/${itineraryId}`);
    }

    getItineraryWebUrl(itineraryId: string): string {
        return `${WEB_BASE_URL}/itinerary/${itineraryId}`;
    }

    async shareItinerary(
        itineraryId: string,
        itineraryTitle: string,
        destination: string,
        price: number
    ): Promise<boolean> {
        try {
            const webUrl = this.getItineraryWebUrl(itineraryId);

            const content: ShareContent = {
                title: itineraryTitle,
                message: `Confira este roteiro digital no VAMO!\n\n${itineraryTitle}\nDestino: ${destination}\nValor: ${formatMoney(price)}\n\n${webUrl}`,
                url: webUrl,
            };

            const result = await Share.share(
                Platform.OS === 'ios'
                    ? { title: content.title, message: content.message, url: content.url }
                    : { title: content.title, message: content.message }
            );

            if (result.action === Share.sharedAction) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error sharing itinerary:', error);
            return false;
        }
    }

    async sharePurchaseConfirmation(
        purchaseId: string,
        itineraryTitle: string,
        date: string
    ): Promise<boolean> {
        try {
            const content: ShareContent = {
                title: 'Meu roteiro no VAMO',
                message: `Comprei um roteiro digital no VAMO!\n\n${itineraryTitle}\nData: ${date}\nPedido: ${purchaseId}`,
            };

            const result = await Share.share({
                title: content.title,
                message: content.message,
            });

            return result.action === Share.sharedAction;
        } catch (error) {
            console.error('Error sharing purchase:', error);
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
                const webUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
                return openExternalUrl(webUrl, {
                    fallbackMessage: 'Não foi possível abrir o WhatsApp agora.',
                });
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            return false;
        }
    }

    async contactSupport(
        phoneNumber: string,
        itineraryTitle?: string,
        itineraryId?: string
    ): Promise<boolean> {
        const context = itineraryTitle
            ? ` sobre o roteiro "${itineraryTitle}"${itineraryId ? ` (ID: ${itineraryId})` : ''}`
            : '';
        return this.openWhatsApp(phoneNumber, `Olá! Preciso de ajuda no VAMO${context}.`);
    }

    /**
     * Handle incoming deep link
     */
    parseDeepLink(url: string): { screen: string; params: Record<string, string> } | null {
        try {
            const parsed = Linking.parse(url);

            if (!parsed.path) return null;

            const segments = parsed.path.split('/');

            if (segments[0] === 'itinerary' && segments[1]) {
                return {
                    screen: 'itinerary',
                    params: { id: segments[1] },
                };
            }

            if (segments[0] === 'purchased-itinerary' && segments[1]) {
                return {
                    screen: 'purchased-itinerary',
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
