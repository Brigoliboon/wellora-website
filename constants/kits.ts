export type KitImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Kit = {
  id: string;
  label: string;
  box: KitImage;
  contents: KitImage[];
};

export const kits: Kit[] = [
  {
    id: "stool-urine",
    label: "Stool and urine collection kit",
    box: {
      src: "/kits/stool-urine/stool-urine-box.png",
      alt: "WellOra stool and urine home collection kit box",
      width: 1594,
      height: 1190,
    },
    contents: [
      {
        src: "/kits/stool-urine/content.png",
        alt: "Open kit box with stool and urine collection cups",
        width: 749,
        height: 624,
      },
      {
        src: "/kits/stool-urine/instruction-manual.png",
        alt: "Home collection instruction manual",
        width: 1288,
        height: 1132,
      },
      {
        src: "/kits/stool-urine/card.png",
        alt: "Result access card with QR code",
        width: 836,
        height: 381,
      },
    ],
  },
  {
    id: "blood",
    label: "Dried blood collection kit",
    box: {
      src: "/kits/blood/box.png",
      alt: "WellOra dried blood home collection kit box",
      width: 1609,
      height: 1202,
    },
    contents: [],
  },
  {
    id: "saliva",
    label: "Saliva collection kit",
    box: {
      src: "/kits/saliva/saliva-box.png",
      alt: "WellOra saliva home collection kit box",
      width: 1592,
      height: 1189,
    },
    contents: [],
  },
];
