from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Trip(Base):
    __tablename__ = "trips"

    __table_args__ = (
        CheckConstraint(
            "end_date >= start_date",
            name="ck_trip_dates_valid",
        ),
        CheckConstraint(
            "accommodation_budget >= 0",
            name="ck_trip_accommodation_non_negative",
        ),
        CheckConstraint(
            "transport_budget >= 0",
            name="ck_trip_transport_non_negative",
        ),
        CheckConstraint(
            "meal_budget >= 0",
            name="ck_trip_meal_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    accommodation_budget: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    transport_budget: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    meal_budget: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    share_code: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="trips",
    )

    stops = relationship(
        "TripStop",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="TripStop.sequence",
    )

    activities = relationship(
        "TripActivity",
        back_populates="trip",
        cascade="all, delete-orphan",
    )


class TripStop(Base):
    __tablename__ = "trip_stops"

    __table_args__ = (
        CheckConstraint(
            "end_date >= start_date",
            name="ck_trip_stop_dates_valid",
        ),
        CheckConstraint(
            "sequence > 0",
            name="ck_trip_stop_sequence_positive",
        ),
        UniqueConstraint(
            "trip_id",
            "sequence",
            name="uq_trip_stop_sequence",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    trip_id: Mapped[int] = mapped_column(
        ForeignKey(
            "trips.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    city_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cities.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    sequence: Mapped[int] = mapped_column(
        nullable=False,
        default=1,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    trip = relationship(
        "Trip",
        back_populates="stops",
    )

    city = relationship(
        "City",
        back_populates="stops",
    )


class TripActivity(Base):
    __tablename__ = "trip_activities"

    __table_args__ = (
        CheckConstraint(
            "estimated_cost >= 0",
            name="ck_trip_activity_cost_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    trip_id: Mapped[int] = mapped_column(
        ForeignKey(
            "trips.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    trip_stop_id: Mapped[int] = mapped_column(
        ForeignKey(
            "trip_stops.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    activity_id: Mapped[int] = mapped_column(
        ForeignKey(
            "activities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    activity_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    start_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    estimated_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    trip = relationship(
        "Trip",
        back_populates="activities",
    )

    activity = relationship(
        "Activity",
        back_populates="trip_activities",
    )

    trip_stop = relationship(
        "TripStop",
    )