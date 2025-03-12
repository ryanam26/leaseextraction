export interface LeaseData {
  monthlyRent: number | null;
  annualRent: number | null;
  address: string | null;
  tenantName: string | null;
  ownerName: string | null;
  isSigned: boolean | null;
  leaseTerm: number | null;
  startDate: string | null;
  endDate: string | null;
  isMonthToMonth: boolean | null;
} 