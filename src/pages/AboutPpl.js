import React, { useState, useEffect } from "react";
import vvk from "../assets/10.jpeg";
import sany from "../assets/5.jpeg";
import naba from "../assets/3.jpeg";
import psp from "../assets/1.jpeg";
import yg from "../assets/4.jpeg";
import ab from "../assets/9.jpeg";
import cd from "../assets/8.jpeg";
import ef from "../assets/7.jpeg";
import gh from "../assets/6.jpeg";
import ij from "../assets/2.jpeg";

export function AboutPpl() {

  const [year, setYear] = useState("");

    useEffect(() => {
      const currentYear = new Date().getFullYear();
      setYear(currentYear);
    }, []);


  const historyData = [
    { year: 2019, champion: "Mayadih Sixer", runner: "Jay Baba Baro Saheb, Sidhi" },
    { year: 2020, champion: "Kings XI, Pundag", runner: "Rampur Trophy Fighters" },
    { year: 2021, champion: "Skipped", runner: "Skipped" },
    { year: 2022, champion: "SSAC Ananda Marga College", runner: "DD Warriors, Pundag" },
    { year: 2023, champion: "Team Avengers, Darikuri", runner: "G. K. Sunrise Tigers" },
    { year: 2024, champion: "DD Warriors, Pundag", runner: "Royal Challengers, Singghagra" },
    { year: 2025, champion: "TBD", runner: "TBD" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">About Pundag Premier League</h1>

      {/* History */}
      <section className="mt-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Tournament History (2019 - {year})</h2>
        <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed">
          A quick look at the champions and runners-up from each season of PPL.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyData.map((item) => (
            <div
              key={item.year}
              className="bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-lg hover:shadow-2xl transition"
            >
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">{item.year}</h3>
              <p className="text-gray-300"><strong>Champion:</strong> {item.champion}</p>
              <p className="text-gray-400"><strong>Runner-up:</strong> {item.runner}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mt-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-3">Our Mission</h2>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          Our mission is to provide a platform for aspiring cricketers to showcase their talent, promote
          sportsmanship, and build a strong cricketing culture within the community. PPL aims to empower young
          players, encourage fitness, and create memorable sporting experiences.
        </p>
      </section>

      {/* Sponsors */}
      <section className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-3">Sponsors</h2>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          We are proud to be supported by local businesses and partners who believe in the growth of sports.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className="bg-gray-800 p-4 rounded-xl text-center shadow-md border border-gray-700"
            >
              Sponsor {num}
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Section */}
      <section className="mt-12 max-w-5xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-yellow-400 mb-3">Interactive Sections</h2>
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Engage with animated statistics, past winners, player highlights, and interactive match timelines.
            More features will be added as the league grows!
          </p>
        </div>
      </section>
      <section className="mt-12 max-w-5xl mx-auto mb-12">
          <PplCommittee />
      </section>
    </div>
  );
}

export function PplCommittee() {
  const committeeMembers = [
    { name: "Vivekananda Mahato", role: "Chairman", img: vvk },
    { name: "Naba Kumar Mahato", role: "Vice-Chairman", img: naba },
    { name: "Yudhisthir Gope", role: "Logistics", img: yg },
    { name: "Sany Paramanik", role: "Secretary", img: sany },
    { name: "Pushpendu Paramanik", role: "Member", img: psp },
    { name: "Manoj Gope", role: "Member", img: ab },
    { name: "Bikash Mahato", role: "Member", img: cd },
    { name: "Pankaj Muda", role: "Member", img: ef },
    { name: "Sanat Mahato", role: "Member", img: gh },
    { name: "Rahul Adhikary", role: "Member", img: ij },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      {/* Header */}
      <h1 className="text-4xl font-bold text-center mb-10 text-yellow-400">PPL Committee Members</h1>

      {/* Committee Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {committeeMembers.map((member, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-2xl transition border border-gray-700"
          >
            <img
              alt="member-photo"
              src={member.img}
              className="w-32 h-32 rounded-full mb-4 border-2 border-yellow-400 object-cover"
            />
            <p className="text-lg font-semibold text-yellow-300">{member.name}</p>
            <p className="text-gray-400 text-sm">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}