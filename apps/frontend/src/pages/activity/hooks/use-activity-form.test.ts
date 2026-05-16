import { ACTIVITY_SUBTYPES, ActivityType } from "@/lib/constants";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { AccountSelectOption } from "../components/forms/fields";
import type { ActivityFormValues } from "../config/activity-form-config";
import { useActivityForm } from "./use-activity-form";

const mutationMocks = vi.hoisted(() => ({
  addMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  saveMutateAsync: vi.fn(),
}));

vi.mock("./use-activity-mutations", () => ({
  useActivityMutations: () => ({
    addActivityMutation: {
      mutateAsync: mutationMocks.addMutateAsync,
      isPending: false,
      error: null,
      isError: false,
    },
    updateActivityMutation: {
      mutateAsync: mutationMocks.updateMutateAsync,
      isPending: false,
      error: null,
      isError: false,
    },
    saveActivitiesMutation: {
      mutateAsync: mutationMocks.saveMutateAsync,
      isPending: false,
      error: null,
      isError: false,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const accounts: AccountSelectOption[] = [
  { value: "acc-usd", label: "USD Account", currency: "USD" },
  { value: "acc-cad", label: "CAD Account", currency: "CAD" },
];

describe("useActivityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationMocks.addMutateAsync.mockResolvedValue({});
    mutationMocks.updateMutateAsync.mockResolvedValue({});
    mutationMocks.saveMutateAsync.mockResolvedValue({});
  });

  it("preserves user-selected currency for DEPOSIT", async () => {
    const { result } = renderHook(() =>
      useActivityForm({
        accounts,
        selectedType: "DEPOSIT",
      }),
    );

    const formData = {
      accountId: "acc-usd",
      activityDate: new Date("2026-02-01T10:00:00.000Z"),
      amount: 1000,
      comment: "test",
      currency: "EUR",
      fxRate: 1.25,
    } as ActivityFormValues;

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mutationMocks.addMutateAsync).toHaveBeenCalledTimes(1);
    expect(mutationMocks.addMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "acc-usd",
        activityType: ActivityType.DEPOSIT,
        currency: "EUR",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Activity added");
  });

  it("falls back to account currency when DEPOSIT currency is empty", async () => {
    const { result } = renderHook(() =>
      useActivityForm({
        accounts,
        selectedType: "DEPOSIT",
      }),
    );

    const formData = {
      accountId: "acc-usd",
      activityDate: new Date("2026-02-01T10:00:00.000Z"),
      amount: 1000,
      comment: null,
      currency: "   ",
    } as ActivityFormValues;

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mutationMocks.addMutateAsync).toHaveBeenCalledTimes(1);
    expect(mutationMocks.addMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "acc-usd",
        activityType: ActivityType.DEPOSIT,
        currency: "USD",
      }),
    );
  });

  it("fills quantity and unitPrice for DEPOSIT submissions", async () => {
    const { result } = renderHook(() =>
      useActivityForm({
        accounts,
        selectedType: "DEPOSIT",
      }),
    );

    const formData = {
      accountId: "acc-usd",
      activityDate: new Date("2026-02-01T10:00:00.000Z"),
      amount: 1250,
      comment: null,
      currency: "USD",
    } as ActivityFormValues;

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mutationMocks.addMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1250,
        quantity: 1,
        unitPrice: 1250,
        activityType: ActivityType.DEPOSIT,
      }),
    );
  });

  it("prefills fixed-term deposit defaults from metadata", () => {
    const { result } = renderHook(() =>
      useActivityForm({
        accounts,
        selectedType: "DEPOSIT",
        activity: {
          id: "dep-1",
          activityType: ActivityType.DEPOSIT,
          subtype: ACTIVITY_SUBTYPES.FIXED_TERM,
          amount: "1250",
          currency: "USD",
          metadata: {
            term_deposit: {
              interest_start_date: "2026-01-01",
              maturity_date: "2029-01-01",
              interest_rate: "3.5",
            },
          },
        } as any,
      }),
    );

    expect(result.current.defaultValues).toMatchObject({
      depositType: "fixed",
      interestRate: 3.5,
      interestStartDate: expect.any(Date),
      maturityDate: expect.any(Date),
    });
  });

  it("preserves user-selected currency for external TRANSFER", async () => {
    const { result } = renderHook(() =>
      useActivityForm({
        accounts,
        selectedType: "TRANSFER",
      }),
    );

    const formData = {
      isExternal: true,
      direction: "in",
      accountId: "acc-usd",
      fromAccountId: "",
      toAccountId: "",
      activityDate: new Date("2026-02-01T10:00:00.000Z"),
      transferMode: "cash",
      amount: 250,
      assetId: null,
      quantity: null,
      unitPrice: null,
      comment: "external transfer",
      currency: "EUR",
      fxRate: 1.2,
      subtype: null,
      quoteMode: "MARKET",
    } as ActivityFormValues;

    await act(async () => {
      await result.current.handleSubmit(formData);
    });

    expect(mutationMocks.addMutateAsync).toHaveBeenCalledTimes(1);
    expect(mutationMocks.addMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "acc-usd",
        activityType: ActivityType.TRANSFER_IN,
        currency: "EUR",
      }),
    );
  });
});
