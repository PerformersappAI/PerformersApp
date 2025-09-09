
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Sparkles, Crown } from 'lucide-react';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import PayPalButton from './PayPalButton';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentSubscription?: UserSubscription | null;
  onSubscribe?: () => void;
  popular?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  plan, 
  currentSubscription, 
  onSubscribe,
  popular = false 
}) => {
  const isCurrentPlan = currentSubscription?.plan_id === plan.id;
  const isDemo = plan.name === 'Demo';
  const isExclusive = plan.name === 'Exclusive';
  
  const getFeaturesList = () => {
    const features = [];
    
    if (plan.limits.script_analyses > 0) {
      features.push(
        plan.limits.script_analyses === -1 
          ? 'Unlimited script analyses' 
          : `${plan.limits.script_analyses} script analyses`
      );
    }
    
    if (plan.limits.ai_messages > 0) {
      features.push(
        plan.limits.ai_messages === -1 
          ? 'Unlimited AI coaching messages' 
          : `${plan.limits.ai_messages} AI coaching messages`
      );
    }
    
    if (plan.limits.video_verifications > 0) {
      features.push(
        plan.limits.video_verifications === -1 
          ? 'Unlimited video verifications' 
          : `${plan.limits.video_verifications} video verifications`
      );
    }

    if (plan.features.script_analysis) features.push('Professional scene analysis');
    if (plan.features.ai_coaching) features.push('AI acting coach');
    if (plan.features.video_verification) features.push('Video performance feedback');
    
    // Add exclusive features
    if (isExclusive) {
      features.push('Priority support');
      features.push('Advanced analytics');
      features.push('Exclusive masterclasses');
    }
    
    return features;
  };

  const getCardStyle = () => {
    if (isCurrentPlan) {
      return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/50 shadow-xl shadow-green-500/20";
    }
    if (isExclusive) {
      return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/50 shadow-xl shadow-purple-500/20";
    }
    if (popular) {
      return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-yellow-500/50 shadow-xl shadow-yellow-500/20";
    }
    if (isDemo) {
      return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-blue-500/50 shadow-xl shadow-blue-500/20";
    }
    return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-600/50 shadow-lg hover:shadow-xl hover:border-gray-500/70";
  };

  return (
    <Card className={`relative backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${getCardStyle()}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
            <Star className="w-4 h-4 mr-1 fill-current" />
            Most Popular
          </Badge>
        </div>
      )}

      {isExclusive && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
            <Crown className="w-4 h-4 mr-1 fill-current" />
            Exclusive
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-4 right-4 z-10">
          <Badge className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg">
            Current Plan
          </Badge>
        </div>
      )}

      {isDemo && (
        <div className="absolute -top-4 left-4 z-10">
          <Badge className="bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Free Trial
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-6 pt-8">
        <CardTitle className="text-3xl font-bold text-white mb-3">{plan.name}</CardTitle>
        <div className="flex items-baseline justify-center mb-4">
          <span className={`text-6xl font-bold ${
            isDemo ? 'text-blue-400' : 
            isExclusive ? 'text-purple-400' :
            popular ? 'text-yellow-400' : 
            isCurrentPlan ? 'text-green-400' : 'text-white'
          }`}>
            {isDemo ? 'FREE' : `$${plan.price}`}
          </span>
          {!isDemo && <span className="text-gray-400 ml-2 text-lg">/month</span>}
        </div>
        <CardDescription className="text-gray-300 text-base leading-relaxed px-2">
          {isDemo 
            ? 'Perfect for trying out the platform and getting started' 
            : isExclusive
            ? 'Ultimate package with unlimited access and exclusive features'
            : popular 
            ? 'Everything you need for professional growth and unlimited access'
            : 'Essential features for serious actors and professionals'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 px-6 pb-8">
        <ul className="space-y-4">
          {getFeaturesList().map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className={`w-5 h-5 mr-3 mt-1 flex-shrink-0 ${
                isDemo ? 'text-blue-400' : 
                isExclusive ? 'text-purple-400' :
                popular ? 'text-yellow-400' : 
                isCurrentPlan ? 'text-green-400' : 'text-gray-300'
              }`} />
              <span className="text-gray-200 text-base leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
        
        {!isCurrentPlan && (
          <div className="pt-6">
            {isDemo ? (
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                onClick={onSubscribe}
              >
                Start Free Trial
              </Button>
            ) : isExclusive ? (
              <div className="space-y-2">
                <PayPalButton 
                  plan={plan} 
                  onSuccess={onSubscribe}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <PayPalButton 
                  plan={plan} 
                  onSuccess={onSubscribe}
                />
              </div>
            )}
          </div>
        )}
        
        {isCurrentPlan && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg rounded-lg shadow-lg" 
            disabled
          >
            <Check className="w-5 h-5 mr-2" />
            Current Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
