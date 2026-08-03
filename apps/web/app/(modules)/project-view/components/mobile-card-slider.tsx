"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import type { ProjectViewData } from "../types";

interface Section {
  id: string;
  title: string;
  render: (project: ProjectViewData) => React.ReactNode;
}

export function MobileCardSlider({
  project,
  sections,
}: {
  project: ProjectViewData;
  sections: Section[];
}) {
  return (
    <div className="md:hidden" data-testid="mobile-card-slider">
      <Swiper modules={[Pagination]} pagination={{ clickable: true }} spaceBetween={16} className="pb-8">
        {sections.map((section) => (
          <SwiperSlide key={section.id}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{section.render(project)}</CardContent>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
