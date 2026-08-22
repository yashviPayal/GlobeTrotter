from datetime import date, time

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    accommodation_budget: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    transport_budget: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    meal_budget: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    share_code: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="trips"
    )

    stops = relationship(
        "TripStop",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="TripStop.sequence"
    )

    activities = relationship(
        "TripActivity",
        back_populates="trip",
        cascade="all, delete-orphan"
    )


class TripStop(Base):
    __tablename__ = "trip_stops"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    city_id: Mapped[int] = mapped_column(
        ForeignKey("cities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    sequence: Mapped[int] = mapped_column(
        default=1,
        nullable=False
    )

    trip = relationship(
        "Trip",
        back_populates="stops"
    )

    city = relationship(
        "City",
        back_populates="stops"
    )


class TripActivity(Base):
    __tablename__ = "trip_activities"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    trip_stop_id: Mapped[int] = mapped_column(
        ForeignKey("trip_stops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    activity_id: Mapped[int] = mapped_column(
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    activity_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    start_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True
    )

    estimated_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    trip = relationship(
        "Trip",
        back_populates="activities"
    )

    activity = relationship(
        "Activity",
        back_populates="trip_activities"
    )

    trip_stop = relationship(
        "TripStop"
    )