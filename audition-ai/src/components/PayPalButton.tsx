
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';

interface PayPalButtonProps {
  plan: SubscriptionPlan;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ plan, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);
  const containerIdRef = useRef(`paypal-button-${plan.id}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderPayPalButton = () => {
      if (!window.paypal || !paypalRef.current || buttonRendered.current) return;

      console.log(`PayPal: Rendering button for plan ${plan.name} (${plan.id})`);

      // Clear any existing PayPal buttons in this container
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      buttonRendered.current = true;

      // For Pro plan, use subscription, otherwise use one-time payment
      if (plan.paypal_plan_id) {
        // Subscription flow for Pro plan
        window.paypal.Buttons({
          style: {
            shape: 'pill',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: (data: any, actions: any) => {
            return actions.subscription.create({
              plan_id: plan.paypal_plan_id
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              console.log('PayPal subscription approved:', data);

              if (!user) {
                throw new Error('User not authenticated');
              }

              // Create subscription in database
              const { data: newSubscription, error } = await supabase
                .from('user_subscriptions')
                .insert({
                  user_id: user.id,
                  plan_id: plan.id,
                  status: 'active',
                  paypal_subscription_id: data.subscriptionID
                })
                .select()
                .single();

              if (error) throw error;

              // Create usage record
              await supabase
                .from('user_usage')
                .insert({
                  user_id: user.id,
                  subscription_id: newSubscription.id
                });

              toast({
                title: "Subscription Successful!",
                description: `Welcome to the ${plan.name} plan!`,
              });

              onSuccess?.();
            } catch (error: any) {
              console.error('Subscription processing error:', error);
              toast({
                title: "Subscription Error",
                description: error.message || "Failed to process subscription",
                variant: "destructive",
              });
            }
          },
          onError: (err: any) => {
            console.error('PayPal subscription error:', err);
            toast({
              title: "Subscription Error",
              description: "There was an error processing your subscription",
              variant: "destructive",
            });
          }
        }).render(paypalRef.current);
      } else {
        // One-time payment flow for other plans
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: plan.price.toString(),
                  currency_code: plan.currency
                },
                description: `${plan.name} Plan - MyAuditionAI.com`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const order = await actions.order.capture();
              console.log('PayPal order captured:', order);

              if (!user) {
                throw new Error('User not authenticated');
              }

              // Create subscription in database
              const { data: newSubscription, error } = await supabase
                .from('user_subscriptions')
                .insert({
                  user_id: user.id,
                  plan_id: plan.id,
                  status: 'active',
                  paypal_subscription_id: order.id
                })
                .select()
                .single();

              if (error) throw error;

              // Create usage record
              await supabase
                .from('user_usage')
                .insert({
                  user_id: user.id,
                  subscription_id: newSubscription.id
                });

              toast({
                title: "Payment Successful!",
                description: `Welcome to the ${plan.name} plan!`,
              });

              onSuccess?.();
            } catch (error: any) {
              console.error('Payment processing error:', error);
              toast({
                title: "Payment Error",
                description: error.message || "Failed to process payment",
                variant: "destructive",
              });
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            toast({
              title: "Payment Error",
              description: "There was an error processing your payment",
              variant: "destructive",
            });
          }
        }).render(paypalRef.current);
      }
    };

    // Load PayPal SDK if not already loaded
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    
    if (!window.paypal && !existingScript) {
      console.log('PayPal: Loading SDK script');
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AYEDG0LTGwLOVEtJVaOV3np5AxHw7abQFFTyCLO5ceWtZ2_HTdyqepwGoJN6OOEhPRxZYiBHADZsXs0R&vault=true&intent=subscription&currency=USD';
      script.onload = renderPayPalButton;
      script.onerror = () => console.error('PayPal: Failed to load SDK script');
      document.head.appendChild(script);
    } else if (window.paypal) {
      console.log('PayPal: SDK already loaded, rendering button');
      renderPayPalButton();
    } else {
      console.log('PayPal: SDK script already exists, waiting for load');
      // Script exists but paypal not loaded yet, wait for it
      const checkPayPal = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkPayPal);
          renderPayPalButton();
        }
      }, 100);
      
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkPayPal), 10000);
    }

    return () => {
      console.log(`PayPal: Cleaning up button for plan ${plan.name} (${plan.id})`);
      buttonRendered.current = false;
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [plan, user, toast, onSuccess]);

  if (plan.price === 0) {
    return null; // Don't show PayPal button for free plans
  }

  return <div ref={paypalRef} className="w-full" />;
};

export default PayPalButton;
