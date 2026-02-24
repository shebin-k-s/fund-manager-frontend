import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useDeleteCard, useMarkCardPaid, useRemoveCardPayment, useCardById } from '../hooks/useCreditCards';
import { CardHeader } from '../components/CrediCardDetail/CardHeader';
import { CardVisual } from '../components/CrediCardDetail/CardVisual';
import { CardPaymentStatus } from '../components/CrediCardDetail/BillingSummary';
import { DeleteSection } from '../components/CrediCardDetail/DeleteSection';

export default function CreditCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: card, isLoading } = useCardById(id!);
  const deleteCard = useDeleteCard();
  const markPaid = useMarkCardPaid();
  const removePayment = useRemoveCardPayment();

  if (!isLoading && !card) {
    return <Navigate to="/cards" replace />;
  }

  const handlePay = (cycle: string, amount: number) => {
    if (card) {
      markPaid.mutate({ cardId: card.id, cycle, amount });
    }
  };

  const handleRemove = (cycle: string) => {
    if (card) {
      removePayment.mutate({ cardId: card.id, cycle });
    }
  };

  const handleDelete = () => {
    if (card) {
      deleteCard.mutate(card.id, {
        onSuccess: () => navigate('/cards'),
      });
    }
  };

  const gradientIndex = card?.id
    ? Math.abs(card.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 4
    : 0;

  const isPending = markPaid.isPending || removePayment.isPending || deleteCard.isPending;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse flex-1" />
          <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
        </div>
        <div className="page-content space-y-6">
          <div className="rounded-2xl p-5 aspect-[1.7/1] bg-muted animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <CardHeader
        cardName={card?.name ?? ''}
        cardId={card?.id ?? ''}
        isPending={isPending}
        isLoading={isLoading}
      />

      <div className="page-content space-y-6 overflow-hidden">
        {card && (
          <>
            <CardVisual card={card} index={1} />

            <CardPaymentStatus
              card={card}
              onPay={handlePay}
              onRemove={handleRemove}
              isPending={isPending}
            />

            <DeleteSection onDelete={handleDelete} isPending={deleteCard.isPending} />
          </>
        )}
      </div>
    </div>
  );
}