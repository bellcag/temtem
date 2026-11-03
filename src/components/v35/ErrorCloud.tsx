import body from "@/assets/figma/error-cloud/body.svg";
import face from "@/assets/figma/error-cloud/face.svg";
import fill from "@/assets/figma/error-cloud/fill.svg";
import shade from "@/assets/figma/error-cloud/shade.svg";
import spark from "@/assets/figma/error-cloud/spark.svg";
import spark2 from "@/assets/figma/error-cloud/spark2.svg";
import spark3 from "@/assets/figma/error-cloud/spark3.svg";
import stroke from "@/assets/figma/error-cloud/stroke.svg";

/** Figma illustration/error-empty-state, Cloud. */
export function ErrorCloud() {
  return (
    <div className="relative size-36 overflow-hidden" aria-hidden>
      <div className="absolute top-1/2 right-[1.39%] left-[2.08%] aspect-[139/116] -translate-y-1/2 overflow-hidden">
        <Piece className="inset-[21.12%_12.23%_18.53%_4.32%]" src={body} />
        <Piece className="inset-[14.66%_6.47%_25%_9.35%]" src={fill} />
        <Piece className="inset-[12.93%_5.04%_23.28%_7.91%]" src={stroke} />
        <Piece className="inset-[19.83%_10.79%_30.17%_14.39%]" src={shade} />
        <Piece className="inset-[23.58%_12.59%_10.96%_26.68%]" src={face} />
        <Piece className="inset-[45.13%_34.89%_42.38%_36.33%]" src={spark} />
        <Piece className="inset-[91.38%_8.63%_0_84.17%]" src={spark2} />
        <Piece className="inset-[0_85.61%_89.66%_5.76%]" src={spark3} />
      </div>
    </div>
  );
}

function Piece({ src, className }: { src: string; className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <img src={src} alt="" className="absolute inset-0 block size-full max-w-none" />
    </div>
  );
}
