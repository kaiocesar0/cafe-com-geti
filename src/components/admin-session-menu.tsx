"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type ComponentProps,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { changeOwnPassword, login, logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** O que o header precisa saber de quem está logado neste navegador. */
export type HeaderSession = { username: string };

const headerButton =
  "border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white";

export function AdminSessionMenu({ session }: { session: HeaderSession | null }) {
  if (!session) return <LoginDialog />;

  return (
    <div className="flex items-center gap-2">
      <ChangeOwnPasswordDialog username={session.username} />
      <SignOutButton />
    </div>
  );
}

/** Entrar sem sair da página: o diálogo abre por cima da tela em que a pessoa já estava. */
function LoginDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <SessionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" className={headerButton}>
          <ShieldCheck className="size-4" aria-hidden />
          Admin
        </Button>
      }
      title="Entrar como admin"
      description="Username e senha liberam as escritas neste navegador."
      submitLabel="Entrar"
      onSubmit={async (fields) => {
        const result = await login({
          username: fields.username ?? "",
          password: fields.password ?? "",
        });
        if (result.error) return result.error;

        setOpen(false);
        toast.success(`Sessão aberta como ${result.session!.username}`);
        router.refresh();
        return null;
      }}
    >
      <Field name="username" label="Username" autoComplete="username" autoFocus />
      <Field
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
      />
    </SessionDialog>
  );
}

/** A troca da própria senha abre pelo clique no username, e pede a senha atual. */
function ChangeOwnPasswordDialog({ username }: { username: string }) {
  const [open, setOpen] = useState(false);

  return (
    <SessionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" className={cn(headerButton, "max-w-40")}>
          <KeyRound className="size-4" aria-hidden />
          <span className="truncate">{username}</span>
        </Button>
      }
      title="Trocar minha senha"
      description="As outras sessões suas caem; este navegador continua aberto."
      submitLabel="Trocar senha"
      onSubmit={async (fields) => {
        const result = await changeOwnPassword({
          currentPassword: fields.currentPassword ?? "",
          newPassword: fields.newPassword ?? "",
        });
        if (result.error) return result.error;

        setOpen(false);
        toast.success("Senha trocada");
        return null;
      }}
    >
      <Field
        name="currentPassword"
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        autoFocus
      />
      <Field
        name="newPassword"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
      />
    </SessionDialog>
  );
}

function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      className={headerButton}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          toast.success("Sessão encerrada");
          router.refresh();
        })
      }
    >
      <LogOut className="size-4" aria-hidden />
      Sair
    </Button>
  );
}

/**
 * Diálogo de credencial: o erro fica na própria caixa, porque quem errou a senha
 * continua olhando para o campo que precisa corrigir.
 */
function SessionDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (fields: Record<string, string>) => Promise<string | null>;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(
      Array.from(new FormData(form), ([name, value]) => [name, String(value)]),
    );

    startTransition(async () => {
      const failure = await onSubmit(fields);
      setError(failure);
      if (!failure) form.reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setError(null);
        onOpenChange(next);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name,
  label,
  ...props
}: { name: string; label: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required {...props} />
    </div>
  );
}
