import type { ActionEvent, ReactionEvent, Thread } from "chat";
import {
  Actions,
  Button,
  Card,
  CardText,
  Divider,
  Field,
  Fields,
  Image,
  LinkButton,
  Section,
  Select,
  SelectOption,
  emoji,
} from "chat";

export interface DemoState {
  counter?: number;
}

export const DEMO_SELECT = "demo_select";
export const DEMO_COUNTER = "demo_counter";
export const DEMO_REACT_BACK = "demo_react_back";

export const DEMO_ACTION_IDS = [DEMO_SELECT, DEMO_COUNTER, DEMO_REACT_BACK];

const DEMO_TRIGGERS = ["!demo", "demo", "!help", "help", "menu", "/demo"];

export function isDemoTrigger(text: string): boolean {
  return DEMO_TRIGGERS.includes(text.trim().toLowerCase());
}

export async function sendDemoMenu(thread: Thread<DemoState>): Promise<void> {
  await thread.post(
    Card({
      title: "Demo del Chat SDK",
      subtitle: "Explora funciones del SDK",
      children: [
        CardText(
          "Selecciona una demo del menú o prueba los botones. También puedes *reaccionar* a cualquier mensaje con un emoji.",
        ),
        Actions([
          Select({
            id: DEMO_SELECT,
            label: "Funciones",
            placeholder: "Elige una demo",
            options: [
              SelectOption({ label: "🎉 Reaccionar a mi mensaje", value: "reaction" }),
              SelectOption({ label: "⌨️ Indicador escribiendo", value: "typing" }),
              SelectOption({ label: "✏️ Editar un mensaje", value: "edit" }),
              SelectOption({ label: "🌊 Streaming de texto", value: "stream" }),
              SelectOption({ label: "📋 Card con campos", value: "fields" }),
              SelectOption({ label: "🤫 Mensaje efímero", value: "ephemeral" }),
              SelectOption({ label: "🖼️ Imagen en card", value: "image" }),
              SelectOption({ label: "🔗 Botón a enlace externo", value: "link" }),
            ],
          }),
        ]),
        Divider(),
        CardText("También puedes sumar al contador abajo:"),
        Actions([Button({ id: DEMO_COUNTER, label: "➕ Sumar 1", style: "primary" })]),
      ],
    }),
  );
}

export async function handleDemoAction(event: ActionEvent): Promise<void> {
  const thread = event.thread as Thread<DemoState> | null;
  if (!thread) return;

  switch (event.actionId) {
    case DEMO_SELECT:
      await runSelectedDemo(thread, event);
      return;
    case DEMO_COUNTER:
      await incrementCounter(thread);
      return;
    case DEMO_REACT_BACK:
      await thread.adapter.addReaction(thread.id, event.messageId, emoji.party);
      await thread.post({
        markdown: "🎉 Le puse una reacción a mi propio mensaje. ¡También puedes reaccionar tú!",
      });
      return;
  }
}

async function runSelectedDemo(thread: Thread<DemoState>, event: ActionEvent): Promise<void> {
  switch (event.value) {
    case "reaction":
      await thread.adapter.addReaction(thread.id, event.messageId, emoji.party);
      await thread.post({
        markdown: "🎉 *Reacción agregada* al card. El SDK abstrae `addReaction` entre plataformas.",
      });
      return;

    case "typing":
      await thread.startTyping();
      await delay(2000);
      await thread.post({
        markdown: "⌨️ Te mostré el indicador *escribiendo...* por 2s con `thread.startTyping()`.",
      });
      return;

    case "edit": {
      const msg = await thread.post({ markdown: "✏️ Paso 1 de 3..." });
      await delay(700);
      await msg.edit({ markdown: "✏️ Paso 2 de 3..." });
      await delay(700);
      await msg.edit({ markdown: "✅ Edité este mensaje 2 veces con `sentMessage.edit()`." });
      return;
    }

    case "stream":
      await thread.post(streamDummyText());
      return;

    case "fields":
      await thread.post(
        Card({
          title: "Perfil de usuario",
          subtitle: "Card con Section + Fields + Divider",
          children: [
            Section([CardText("*Información básica*")]),
            Fields([
              Field({ label: "Nombre", value: "Ada Lovelace" }),
              Field({ label: "Rol", value: "Ingeniera" }),
              Field({ label: "Equipo", value: "Plataforma" }),
              Field({ label: "Estado", value: "Activo ✅" }),
            ]),
            Divider(),
            CardText(
              "_Este layout se renderiza nativo en Slack/Teams y como texto formateado en otros._",
            ),
          ],
        }),
      );
      return;

    case "ephemeral": {
      const result = await thread.postEphemeral(
        event.user,
        {
          markdown:
            "🤫 *Mensaje efímero*: solo tú lo ves (o se envía por DM si la plataforma no soporta efímeros).",
        },
        { fallbackToDM: true },
      );
      if (!result) {
        await thread.post({
          markdown: "Esta plataforma no soporta efímeros ni DM fallback.",
        });
      }
      return;
    }

    case "image":
      await thread.post(
        Card({
          title: "Card con imagen",
          children: [
            Image({
              url: "https://picsum.photos/seed/chat-sdk/600/300",
              alt: "Random image",
            }),
            CardText("Imagen incrustada desde una URL pública."),
            Actions([Button({ id: DEMO_REACT_BACK, label: "🎉 Reacciona", style: "primary" })]),
          ],
        }),
      );
      return;

    case "link":
      await thread.post(
        Card({
          title: "Enlace externo",
          children: [
            CardText("Los `LinkButton` abren URLs sin disparar `onAction`."),
            Actions([LinkButton({ url: "https://chat.dev", label: "Ver docs del SDK" })]),
          ],
        }),
      );
      return;

    default:
      await thread.post({ markdown: `Opción desconocida: ${event.value}` });
  }
}

async function incrementCounter(thread: Thread<DemoState>): Promise<void> {
  const state = await thread.state;
  const next = (state?.counter ?? 0) + 1;
  await thread.setState({ counter: next });
  await thread.post(
    Card({
      title: "🔢 Contador persistente",
      children: [
        CardText(`Has clicado *${next}* ${next === 1 ? "vez" : "veces"}.`),
        CardText("_El valor se guarda con `thread.setState()` (Redis)._"),
        Actions([Button({ id: DEMO_COUNTER, label: "➕ Sumar 1", style: "primary" })]),
      ],
    }),
  );
}

export async function handleReaction(event: ReactionEvent): Promise<void> {
  if (!event.added) return;
  await event.thread.post({
    markdown: `👀 Detecté tu reacción *${event.emoji}* vía \`onReaction\`.`,
  });
}

async function* streamDummyText(): AsyncGenerator<string> {
  const words =
    "Esto es un stream de texto, palabra por palabra, usando thread.post(asyncIterable). El SDK usa streaming nativo donde existe (Slack) y post+edit como fallback en el resto.".split(
      " ",
    );
  for (const w of words) {
    await delay(120);
    yield w + " ";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
