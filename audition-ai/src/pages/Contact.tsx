
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

const Contact = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        subject: location.state.subject || "",
        message: location.state.message || ""
      }));
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendEmail = () => {
    window.open("mailto:Coach@MyAuditionai.com", "_blank");
  };

  const handleCallNow = () => {
    window.open("tel:+17024815829", "_blank");
  };

  const handleStartChat = () => {
    toast({
      title: "Chat Feature",
      description: "Live chat will be available soon! Please use email or phone for now.",
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "Thank you for your message. We'll get back to you within 24 hours.",
    });
    
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: ""
    });
  };

const handleViewFAQ = () => {
  navigate("/faq");
};

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "Coach@MyAuditionai.com",
      action: "Send Email",
      handler: handleSendEmail
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Talk to our team during business hours",
      contact: "702-481-5829",
      action: "Call Now",
      handler: handleCallNow
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with us in real-time",
      contact: "Available Mon-Fri 9AM-6PM PST",
      action: "Start Chat",
      handler: handleStartChat
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Get in{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions about our coaching services? Need technical support? 
              Want to discuss custom solutions for your acting studio? We're here to help.
            </p>
          </div>

          {/* Contact Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors text-center h-full flex flex-col">
                <CardHeader>
                  <method.icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <CardTitle className="text-white text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <p className="text-gray-400">{method.description}</p>
                    <p className="text-white font-medium">{method.contact}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors mt-auto"
                    onClick={method.handler}
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Send us a Message</CardTitle>
                <p className="text-gray-400">We'll get back to you within 24 hours</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSendMessage}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">First Name</label>
                      <input 
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                      <input 
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">Email</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">Subject</label>
                    <input 
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-500"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white mb-2">Message</label>
                    <textarea 
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-yellow-500 resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-16 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-300 mb-4">
              Looking for quick answers? Check out our FAQ section for common questions about 
              our services, billing, and technical support.
            </p>
            <Button variant="outline" className="bg-transparent border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors" onClick={handleViewFAQ}>
              View FAQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
