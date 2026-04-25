export interface StatementRow {
    id: string;
    type: 'fund' | 'card';
    name: string;
    dueDate: Date;
    isPaid: boolean;
    amount: number;
    dateLabel?: string;
}
