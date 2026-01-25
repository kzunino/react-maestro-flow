"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/ui/button/Button";
import { useWizard, useWizardSkip } from "@/wizard";

export default function PageC() {
	const { goToNext, goToPrevious } = useWizard();
	const skipCurrentPage = useWizardSkip();
	const [isChecking, setIsChecking] = useState(true);

	// Example: Check if page should be skipped after loading (e.g., API call)
	// This demonstrates conditional skipping during page load
	useEffect(() => {
		// Simulate an async check (API call, etc.)
		const checkShouldSkip = async () => {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Example: Check some condition (could be API response, state, etc.)
			// In this case, we'll always skip, but you could check state or API response
			const shouldSkip = true; // Replace with your actual condition

			if (shouldSkip) {
				// Skip this page and navigate to next
				skipCurrentPage();
			} else {
				setIsChecking(false);
			}
		};

		checkShouldSkip();
	}, [skipCurrentPage]);

	// Show loader while checking
	if (isChecking) {
		return (
			<div className="container mx-auto p-8 max-w-2xl">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-muted-foreground">Checking conditions...</div>
				</div>
			</div>
		);
	}

	// This content would only show if the page is not skipped
	return (
		<div className="container mx-auto p-8 max-w-2xl">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Page C</h1>
				<p className="text-muted-foreground">
					This page would only render if the skip check returned false.
				</p>

				<div className="flex justify-between">
					<Button variant="secondary" onClick={goToPrevious}>
						← Back
					</Button>
					<Button onClick={goToNext}>Next →</Button>
				</div>
			</div>
		</div>
	);
}
