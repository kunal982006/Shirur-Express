import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-primary/5 text-center pb-6 border-b">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-primary">
                        Privacy Policy
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Effective Date: December 29, 2025
                    </p>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                            <p className="text-lg leading-relaxed">
                                At <strong>Shirur Express</strong>, we are committed to protecting
                                your privacy. This Privacy Policy explains how we collect, use,
                                and safeguard your information when you use our multi-service
                                platform for food delivery, home maintenance, wellness, grocery
                                (via G-MART), and real estate.
                            </p>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    1. Information We Collect
                                </h3>
                                <p className="mb-2">
                                    To provide a seamless digital experience, we collect:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Personal Identification:</strong> Name, Email Address,
                                        and Phone Number for account management and order tracking.
                                    </li>
                                    <li>
                                        <strong>Location Data:</strong> Required to dispatch service
                                        providers (plumbers, electricians) and delivery partners to
                                        your doorstep.
                                    </li>
                                    <li>
                                        <strong>Transaction Details:</strong> We operate on a 100%
                                        cashless model. We do not store full credit card/debit card
                                        details on our local servers; all payments are handled via
                                        secure encrypted gateways.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    2. How We Use Your Information
                                </h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Service Delivery:</strong> To bridge the gap between
                                        customers and local providers (G-MART, beauticians,
                                        technicians).
                                    </li>
                                    <li>
                                        <strong>Order Management:</strong> Vendors use your data to
                                        manage profiles, update live menus, and track real-time
                                        orders.
                                    </li>
                                    <li>
                                        <strong>Real Estate Connectivity:</strong> To allow direct
                                        contact between homeowners and property seekers without
                                        middleman fees.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    3. Data Sharing & Third Parties
                                </h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Service Providers:</strong> Your contact and location
                                        details are shared with the specific vendor or technician
                                        you book.
                                    </li>
                                    <li>
                                        <strong>Exclusive Partnerships:</strong> Grocery data is
                                        shared exclusively with G-MART for inventory and stock
                                        updates.
                                    </li>
                                    <li>
                                        <strong>No Data Selling:</strong> We do not sell your
                                        personal data to third-party marketing agencies.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    4. Data Security and Purging
                                </h3>
                                <p className="mb-2">We prioritize your security:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Automatic Purging:</strong> Once a transaction is
                                        completed and the service cycle is closed, sensitive
                                        customer data is purged from our immediate system.
                                    </li>
                                    <li>
                                        <strong>Bookkeeping:</strong> A digital history of billing
                                        is maintained for bookkeeping and transparency purposes
                                        within the partner dashboard.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    5. Account Deletion
                                </h3>
                                <p>
                                    Users have the right to request the deletion of their account
                                    and associated data. You can submit a request through our
                                    dedicated{" "}
                                    <a
                                        href="/delete-account"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Account Deletion Page
                                    </a>
                                    .
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                                    6. Contact Us
                                </h3>
                                <p>
                                    For any privacy-related queries, reach out to the Shirur
                                    Express Agency operator.
                                </p>
                            </section>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
