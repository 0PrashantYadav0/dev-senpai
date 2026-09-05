"use client";

import { sendEmail } from "@/lib/actions";
import { ContactFormSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

type Inputs = z.infer<typeof ContactFormSchema>;

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const processForm: SubmitHandler<Inputs> = async (data) => {
    const result = await sendEmail(data);
    if (result.error) {
      toast.error("The message could not be sent. Email him directly instead.");
      return;
    }
    toast.success("Message sent. He usually replies within a day.");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm">
            Name
          </label>
          <Input id="name" type="text" autoComplete="name" {...register("name")} />
          {errors.name?.message && <p className="input-error">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email?.message && <p className="input-error">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm">
          Message
        </label>
        <Textarea
          id="message"
          rows={6}
          placeholder="A role, a project, or a question about something on the site."
          className="resize-y"
          {...register("message")}
        />
        {errors.message?.message && <p className="input-error">{errors.message.message}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Sending" : "Send message"}
        </button>
        <p className="text-xs text-muted-foreground">
          Your message is only used to reply to you. See the{" "}
          <Link href="/privacy" className="link">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
