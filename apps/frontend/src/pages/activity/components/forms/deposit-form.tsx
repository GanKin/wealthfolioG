import { useSettings } from "@/hooks/use-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@wealthfolio/ui/components/ui/button";
import { Card, CardContent } from "@wealthfolio/ui/components/ui/card";
import { Icons } from "@wealthfolio/ui/components/ui/icons";
import { Label } from "@wealthfolio/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@wealthfolio/ui/components/ui/radio-group";
import { useMemo } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  AccountSelect,
  AdvancedOptionsSection,
  AmountInput,
  createValidatedSubmit,
  DatePicker,
  NotesInput,
  type AccountSelectOption,
} from "./fields";

// Deposit type: demand (活期) or fixed (定期)
export const DEPOSIT_TYPES = {
  DEMAND: "demand",
  FIXED: "fixed",
} as const;

export type DepositType = (typeof DEPOSIT_TYPES)[keyof typeof DEPOSIT_TYPES];

// Zod schema for DepositForm validation
export const depositFormSchema = z
  .object({
    accountId: z.string().min(1, { message: "Please select an account." }),
    activityDate: z.date({ required_error: "Please select a date." }),
    amount: z.coerce
      .number({
        required_error: "Please enter an amount.",
        invalid_type_error: "Amount must be a number.",
      })
      .positive({ message: "Amount must be greater than 0." }),
    comment: z.string().optional().nullable(),
    // Deposit type: demand or fixed
    depositType: z.enum([DEPOSIT_TYPES.DEMAND, DEPOSIT_TYPES.FIXED]).default(DEPOSIT_TYPES.DEMAND),
    // Fixed-term fields (only required when depositType is "fixed")
    interestStartDate: z.date().optional().nullable(),
    maturityDate: z.date().optional().nullable(),
    interestRate: z.coerce.number().optional().nullable(),
    // Advanced options
    currency: z.string().min(1, { message: "Currency is required." }),
    fxRate: z.coerce
      .number({
        invalid_type_error: "FX Rate must be a number.",
      })
      .positive({ message: "FX Rate must be positive." })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.depositType === DEPOSIT_TYPES.FIXED) {
      if (!data.interestStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interestStartDate"],
          message: "Please select an interest start date.",
        });
      }
      if (!data.maturityDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maturityDate"],
          message: "Please select a maturity date.",
        });
      }
      if (data.interestRate == null || data.interestRate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interestRate"],
          message: "Please enter a positive interest rate.",
        });
      }
    }
  });

export type DepositFormValues = z.infer<typeof depositFormSchema>;

interface DepositFormProps {
  accounts: AccountSelectOption[];
  defaultValues?: Partial<DepositFormValues>;
  onSubmit: (data: DepositFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function DepositForm({
  accounts,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: DepositFormProps) {
  const { data: settings } = useSettings();
  const baseCurrency = settings?.baseCurrency;

  // Compute initial account and currency for defaultValues
  const initialAccountId =
    defaultValues?.accountId ?? (accounts.length === 1 ? accounts[0].value : "");
  const initialAccount = accounts.find((a) => a.value === initialAccountId);
  const initialCurrency = defaultValues?.currency?.trim() || initialAccount?.currency;

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema) as Resolver<DepositFormValues>,
    mode: "onSubmit", // Validate only on submit - works correctly with default values
    defaultValues: {
      accountId: initialAccountId,
      activityDate: new Date(),
      amount: undefined,
      comment: null,
      depositType: DEPOSIT_TYPES.DEMAND,
      interestStartDate: null,
      maturityDate: null,
      interestRate: null,
      fxRate: undefined,
      ...defaultValues,
      currency: defaultValues?.currency?.trim() || initialCurrency,
    },
  });

  const { watch, setValue } = form;
  const accountId = watch("accountId");
  const currency = watch("currency");
  const depositType = watch("depositType");

  // Get account currency from selected account
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.value === accountId),
    [accounts, accountId],
  );
  const accountCurrency = selectedAccount?.currency;

  const handleSubmit = createValidatedSubmit(form, async (data) => {
    await onSubmit(data);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-6 pt-4">
            {/* Account Selection */}
            <AccountSelect name="accountId" accounts={accounts} currencyName="currency" />

            {/* Date Picker */}
            <DatePicker name="activityDate" label="Date" />

            {/* Amount */}
            <AmountInput name="amount" label="Amount" currency={currency} />

            {/* Deposit Type Selector */}
            <div className="space-y-2">
              <Label>Deposit Type</Label>
              <RadioGroup
                value={depositType}
                onValueChange={(val) => {
                  setValue("depositType", val as DepositType, {
                    shouldValidate: false,
                  });
                  if (val === DEPOSIT_TYPES.DEMAND) {
                    setValue("interestStartDate", null);
                    setValue("maturityDate", null);
                    setValue("interestRate", null);
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={DEPOSIT_TYPES.DEMAND} id="deposit-demand" />
                  <Label htmlFor="deposit-demand" className="cursor-pointer">
                    Demand Deposit (活期存款)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={DEPOSIT_TYPES.FIXED} id="deposit-fixed" />
                  <Label htmlFor="deposit-fixed" className="cursor-pointer">
                    Fixed-Term Deposit (定期存款)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Fixed-Term Deposit Fields */}
            {depositType === DEPOSIT_TYPES.FIXED && (
              <div className="space-y-4 rounded-md border p-4">
                <DatePicker name="interestStartDate" label="Interest Start Date (起息日)" />
                <DatePicker name="maturityDate" label="Maturity Date (到期日)" />
                <AmountInput
                  name="interestRate"
                  label="Interest Rate % (定期利率)"
                  currency={undefined}
                  placeholder="e.g. 3.5"
                  maxDecimalPlaces={4}
                />
              </div>
            )}

            {/* Advanced Options - Currency and FX Rate (no subtypes for deposits) */}
            <AdvancedOptionsSection
              currencyName="currency"
              fxRateName="fxRate"
              accountCurrency={accountCurrency}
              baseCurrency={baseCurrency}
              showSubtype={false}
            />

            {/* Notes */}
            <NotesInput name="comment" label="Notes" placeholder="Add an optional note..." />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? (
              <Icons.Check className="mr-2 h-4 w-4" />
            ) : (
              <Icons.Plus className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update" : "Add Deposit"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
