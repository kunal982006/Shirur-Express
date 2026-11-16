import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReviewList {
    averageRating: number | null;
    reviewCount: number;
    reviews: { id: string; rating: number; comment: string | null; createdAt: string | null; userName: string }[];
}

interface MyReview {
    canReview: boolean;
    review: { rating: number; comment: string | null } | null;
}

const reviewsKey = (providerId: string) => [`/api/providers/${providerId}/reviews`];
const myReviewKey = (providerId: string) => [`/api/providers/${providerId}/my-review`];

function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (value: number) => void; size?: string }) {
    return (
        <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const icon = <Star className={`${size} ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />;
                return onChange ? (
                    <button key={star} type="button" role="radio" aria-checked={star === value} aria-label={`${star} star${star > 1 ? "s" : ""}`} className="p-1" onClick={() => onChange(star)}>
                        {icon}
                    </button>
                ) : <span key={star}>{icon}</span>;
            })}
        </span>
    );
}

// Star picker and comment box. Only customers with a delivered order from the provider can
// submit; submitting again replaces their earlier review.
function ReviewForm({ providerId, onSaved }: { providerId: string; onSaved?: () => void }) {
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const { data: mine, isLoading } = useQuery<MyReview>({
        queryKey: myReviewKey(providerId),
        queryFn: () => apiRequest("GET", `/api/providers/${providerId}/my-review`).then((res) => res.json()),
        enabled: isAuthenticated,
        staleTime: 0,
    });

    useEffect(() => {
        if (mine?.review) {
            setRating(mine.review.rating);
            setComment(mine.review.comment || "");
        }
    }, [mine?.review?.rating, mine?.review?.comment]);

    const save = useMutation({
        mutationFn: () => apiRequest("POST", `/api/providers/${providerId}/reviews`, { rating, comment: comment.trim() || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewsKey(providerId) });
            queryClient.invalidateQueries({ queryKey: myReviewKey(providerId) });
            toast({ title: "Thanks for your review" });
            onSaved?.();
        },
        onError: () => toast({ title: "Could not save your review", description: "Please try again.", variant: "destructive" }),
    });

    if (!isAuthenticated) {
        return <p className="text-sm text-muted-foreground">Log in and order from here to leave a rating.</p>;
    }
    if (isLoading) return <div className="h-24 animate-pulse rounded-xl bg-muted" />;
    if (!mine?.canReview) {
        return <p className="text-sm text-muted-foreground">You can rate this place once an order from it has been delivered.</p>;
    }

    return (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (rating > 0) save.mutate(); }}>
            <div>
                <p className="mb-1 text-sm font-semibold">{mine.review ? "Your rating" : "Rate your order"}</p>
                <Stars value={rating} onChange={setRating} size="h-7 w-7" />
            </div>
            <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="How was the food? (optional)"
                aria-label="Review comment"
            />
            <Button type="submit" className="w-full rounded-xl" disabled={rating === 0 || save.isPending}>
                {save.isPending ? "Saving..." : mine.review ? "Update review" : "Submit review"}
            </Button>
        </form>
    );
}

// Reviews tab of a restaurant or street food vendor: average, the form, and every review.
export function ProviderReviews({ providerId }: { providerId: string }) {
    const { data, isLoading } = useQuery<ReviewList>({
        queryKey: reviewsKey(providerId),
        queryFn: () => apiRequest("GET", `/api/providers/${providerId}/reviews`).then((res) => res.json()),
        staleTime: 60 * 1000,
    });

    return (
        <div className="space-y-5 p-4">
            <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold">{data?.averageRating ?? "–"}</span>
                <div>
                    <Stars value={Math.round(data?.averageRating || 0)} />
                    <p className="text-xs text-muted-foreground">
                        {data?.reviewCount ? `${data.reviewCount} review${data.reviewCount > 1 ? "s" : ""} from customers who ordered here` : "No reviews yet"}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border p-4">
                <ReviewForm providerId={providerId} />
            </div>

            {isLoading ? (
                <div className="h-20 animate-pulse rounded-xl bg-muted" />
            ) : (
                <ul className="divide-y">
                    {(data?.reviews || []).map((review) => (
                        <li key={review.id} className="space-y-1 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold">{review.userName}</span>
                                {review.createdAt && (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                )}
                            </div>
                            <Stars value={review.rating} />
                            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// "Rate order" button for a delivered order in the customer's order list.
export function RateOrderButton({ providerId }: { providerId: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
                <Star className="mr-2 h-4 w-4" />
                Rate this order
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Rate your order</DialogTitle>
                        <DialogDescription>Your rating helps other customers in Shirur choose.</DialogDescription>
                    </DialogHeader>
                    {open && <ReviewForm providerId={providerId} onSaved={() => setOpen(false)} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
