"use client";

import { Button } from "@/components/shared/ui/button/Button";
import { useWizard, useWizardNavigation, useWizardState } from "@/wizard";

export default function PageE() {
	const { goToNext, goToPrevious } = useWizard();
	const { currentPage } = useWizardNavigation();
	const [premiumFeature, setPremiumFeature] =
		useWizardState<string>("premiumFeature");
	const [email] = useWizardState<string>("email");

	return (
		<div className="container mx-auto p-8 max-w-2xl">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Page E - Premium Feature</h1>
				<p className="text-muted-foreground">
					Welcome, premium user! ({email}) This is a special page only for
					premium users.
				</p>

				<div className="space-y-4">
					<label htmlFor="premiumFeature" className="block text-sm font-medium">
						Premium Feature
					</label>
					<input
						id="premiumFeature"
						type="text"
						value={premiumFeature || ""}
						onChange={(e) => setPremiumFeature(e.target.value)}
						className="w-full px-3 py-2 border rounded-md"
						placeholder="Enter premium feature"
					/>
				</div>

				<div className="flex justify-between">
					<Button variant="secondary" onClick={goToPrevious}>
						← Back
					</Button>
					<Button onClick={goToNext} disabled={!premiumFeature}>
						Next →
					</Button>
				</div>

				<div className="mt-4 p-4 bg-muted rounded-md">
					<p className="text-sm text-muted-foreground">
						Current page: {currentPage}
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						This page is only accessible to premium users. Both branches
						converge on Page D.
					</p>
				</div>
			</div>
		</div>
	);
}
